import assert from 'node:assert/strict'
import { randomUUID,createHash } from 'node:crypto'
import { Pool } from 'pg'
import { trafficDay, visitorHash } from '../lib/traffic.ts'
const base=process.env.TEST_URL || 'http://localhost:3000'
const ua='MirrorMoney QA '+randomUUID(), ip='192.0.2.123', day=trafficDay()
const hash=visitorHash(day,ip,ua,process.env.NEXTAUTH_SECRET)
const pool=new Pool({connectionString:process.env.MIRROR_DATABASE_URL})
let accepted=0
const send=async(body,headers={})=>fetch(base+'/api/traffic',{method:'POST',headers:{origin:base,'content-type':'application/json','user-agent':ua,'x-vercel-forwarded-for':ip,...headers},body:JSON.stringify(body)})
try {
 assert.equal((await send({path:'/'},{origin:'https://invalid.example'})).status,403)
 assert.equal((await send({path:'/admin/users'})).status,400)
 assert.equal((await send(null)).status,400)
 assert.equal((await send({path:'/'},{dnt:'1'})).status,204)
 assert.equal((await send({path:'/'},{'sec-gpc':'1'})).status,204)
 assert.equal((await send({path:'/'},{'user-agent':'ExampleBot'})).status,204)
 for(let i=0;i<2;i++){assert.equal((await send({path:'/faq'})).status,204);accepted++}
 assert.equal((await pool.query('SELECT 1 FROM "TrafficVisitor" WHERE day=$1 AND hash=$2',[day,hash])).rowCount,1)
 const r=await fetch(base+'/admin/users',{redirect:'manual'});assert.ok([303,307].includes(r.status))
 console.log('PASS traffic acceptance, deduplication, privacy exclusions, input validation and admin access protection')
}finally{
 const db=await pool.connect();try{await db.query('BEGIN');await db.query('DELETE FROM "TrafficVisitor" WHERE day=$1 AND hash=$2',[day,hash]);if(accepted){await db.query('UPDATE "TrafficDay" SET views=views-$2,visitors=visitors-1 WHERE day=$1 AND path=\'*\'',[day,accepted]);await db.query('UPDATE "TrafficDay" SET views=views-$2 WHERE day=$1 AND path=\'/faq\'',[day,accepted])}await db.query('DELETE FROM "RateLimit" WHERE key=$1',[createHash('sha256').update(`traffic:${hash}:${Math.floor(Date.now()/86400000)}`).digest('hex')]);await db.query('COMMIT')}finally{db.release();await pool.end()}
}
