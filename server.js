
const express=require("express"), path=require("path"), fs=require("fs");
const Database=require("better-sqlite3"), bcrypt=require("bcryptjs"), jwt=require("jsonwebtoken"), multer=require("multer");
const app=express(), PORT=process.env.PORT||3000;
const DATA=path.join(__dirname,"data"); fs.mkdirSync(DATA,{recursive:true});
const db=new Database(path.join(DATA,"shop.db"));
db.pragma("journal_mode=WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS admins(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,category TEXT NOT NULL,price INTEGER DEFAULT 0,code TEXT,pack TEXT,description TEXT,image TEXT,active INTEGER DEFAULT 1,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY AUTOINCREMENT,customer_name TEXT,phone TEXT,address TEXT,note TEXT,total INTEGER,status TEXT DEFAULT 'new',items_json TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT);
`);
const adminEmail=process.env.ADMIN_EMAIL||"toda98520@gmail.com";
const adminPass=process.env.ADMIN_PASSWORD||"Hoailam778979999";
if(!db.prepare("SELECT 1 FROM admins LIMIT 1").get())
 db.prepare("INSERT INTO admins(email,password_hash) VALUES(?,?)").run(adminEmail,bcrypt.hashSync(adminPass,12));
const count=db.prepare("SELECT COUNT(*) c FROM products").get().c;
if(!count){
 const seed=[
 ["Gạo Jasmine Thái 5 kg","dry",0,"","5 kg","Gạo thơm",""],
 ["Nước mắm Phú Quốc 500 ml","spice",0,"","500 ml","Gia vị Việt",""],
 ["Tôm sú đông lạnh 1 kg","frozen",0,"","1 kg","Hải sản",""],
 ["Xoài chín Việt Nam","fruit",0,"","Theo mùa","Hoa quả",""],
 ["Rau muống tươi","veg",0,"","Bó","Rau củ",""],
 ["Bún gạo khô 400 g","dry",0,"","400 g","Đồ khô",""],
 ["Tương ớt Việt Nam","spice",0,"","Chai","Gia vị",""],
 ["Nem rán đông lạnh","frozen",0,"","Gói","Món Việt",""]
 ];
 const ins=db.prepare("INSERT INTO products(name,category,price,code,pack,description,image) VALUES(?,?,?,?,?,?,?)");
 seed.forEach(x=>ins.run(...x));
}
const settings={name:"THỊNH PHÁT",subtitle:"Vietnamese Food · Czechia",address:"Prague, Czech Republic",phone:"",email:""};
for(const [k,v] of Object.entries(settings)) db.prepare("INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)").run(k,v);

app.use(express.json({limit:"2mb"}));
app.use(express.urlencoded({extended:true}));
const upload=multer({dest:path.join(DATA,"uploads")});
function auth(req,res,next){
 const token=(req.headers.authorization||"").replace(/^Bearer\s+/,"");
 try{req.admin=jwt.verify(token,process.env.JWT_SECRET||"change-this-secret");next()}
 catch(e){res.status(401).json({error:"Unauthorized"})}
}
app.post("/api/login",(req,res)=>{
 const a=db.prepare("SELECT * FROM admins WHERE email=?").get(req.body.email||"");
 if(!a||!bcrypt.compareSync(req.body.password||"",a.password_hash)) return res.status(401).json({error:"Sai email hoặc mật khẩu"});
 const token=jwt.sign({id:a.id,email:a.email},process.env.JWT_SECRET||"change-this-secret",{expiresIn:"7d"});
 res.json({token});
});
app.get("/api/products",(req,res)=>res.json(db.prepare("SELECT * FROM products WHERE active=1 ORDER BY id DESC").all()));
app.get("/api/products/all",auth,(req,res)=>res.json(db.prepare("SELECT * FROM products ORDER BY id DESC").all()));
app.post("/api/products",auth,(req,res)=>{
 const p=req.body; const r=db.prepare("INSERT INTO products(name,category,price,code,pack,description,image,active) VALUES(?,?,?,?,?,?,?,?)").run(p.name,p.category,Number(p.price)||0,p.code||"",p.pack||"",p.description||"",p.image||"",p.active===false?0:1);
 res.json(db.prepare("SELECT * FROM products WHERE id=?").get(r.lastInsertRowid));
});
app.put("/api/products/:id",auth,(req,res)=>{
 const p=req.body; db.prepare("UPDATE products SET name=?,category=?,price=?,code=?,pack=?,description=?,image=?,active=? WHERE id=?").run(p.name,p.category,Number(p.price)||0,p.code||"",p.pack||"",p.description||"",p.image||"",p.active===false?0:1,req.params.id);
 res.json(db.prepare("SELECT * FROM products WHERE id=?").get(req.params.id));
});
app.delete("/api/products/:id",auth,(req,res)=>{db.prepare("DELETE FROM products WHERE id=?").run(req.params.id);res.json({ok:true})});
app.post("/api/upload",auth,upload.single("image"),(req,res)=>{
 if(!req.file) return res.status(400).json({error:"No file"});
 const ext=path.extname(req.file.originalname)||".jpg", name=req.file.filename+ext, dest=path.join(DATA,"uploads",name);
 fs.renameSync(req.file.path,dest); res.json({url:"/uploads/"+name});
});
app.get("/api/settings",(req,res)=>{const rows=db.prepare("SELECT * FROM settings").all();res.json(Object.fromEntries(rows.map(x=>[x.key,x.value])))});
app.put("/api/settings",auth,(req,res)=>{const s=db.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value");for(const [k,v] of Object.entries(req.body))s.run(k,String(v));res.json({ok:true})});
app.post("/api/orders",(req,res)=>{
 const {customer_name,phone,address,note,total,items}=req.body;
 if(!customer_name||!phone||!address||!Array.isArray(items)||!items.length) return res.status(400).json({error:"Thiếu thông tin đặt hàng"});
 const r=db.prepare("INSERT INTO orders(customer_name,phone,address,note,total,items_json) VALUES(?,?,?,?,?,?)").run(customer_name,phone,address,note||"",Number(total)||0,JSON.stringify(items));
 res.json({id:r.lastInsertRowid});
});
app.get("/api/orders",auth,(req,res)=>res.json(db.prepare("SELECT * FROM orders ORDER BY id DESC").all()));
app.put("/api/orders/:id",auth,(req,res)=>{db.prepare("UPDATE orders SET status=? WHERE id=?").run(req.body.status,req.params.id);res.json({ok:true})});
app.use("/uploads",express.static(path.join(DATA,"uploads")));
app.use(express.static(path.join(__dirname,"public")));
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log(`ThinhPhatFood running on http://localhost:${PORT}`));
