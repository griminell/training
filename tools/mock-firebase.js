const http=require('http');const db={};const subs=[];
http.createServer((q,r)=>{r.setHeader('Access-Control-Allow-Origin','*');r.setHeader('Access-Control-Allow-Methods','*');r.setHeader('Access-Control-Allow-Headers','*');
if(q.method==='OPTIONS'){r.end();return}
const u=new URL(q.url,'http://x');const path=decodeURIComponent(u.pathname).replace(/^\/|\.json$/g,'');
if(q.method==='PUT'){let b='';q.on('data',d=>b+=d);q.on('end',()=>{db[path]=JSON.parse(b);subs.forEach(s=>s.write('event: put\ndata: {}\n\n'));r.end(b)});return}
if(q.headers.accept==='text/event-stream'){r.writeHead(200,{'Content-Type':'text/event-stream'});r.write('event: put\ndata: {}\n\n');subs.push(r);return}
const pre=path+'/';const o={};for(const k in db)if(k.startsWith(pre))o[k.slice(pre.length)]=u.searchParams.has('shallow')?true:db[k];
if(!u.searchParams.has('shallow')&&db[path]!==undefined)return r.end(JSON.stringify(db[path]));
r.end(JSON.stringify(Object.keys(o).length?o:null))}).listen(9000);
