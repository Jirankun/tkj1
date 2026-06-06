/**
 * TKJ OnE — Math Challenge v4.0
 * 278+ jenis soal Matematika SMA & TKJ Jaringan. A/B/C/D/E. Zero page reload. Hemat kuota.
 */
(function(){'use strict'
const _=Math,$r=(m,x)=>_.floor(_.random()*(x-m+1))+m
const $p=a=>a[_.floor(_.random()*a.length)]
const N=['Alex','Bella','Cipta','Dinda','Eko','Fitri','Gilang','Hana','Irfan','Jasmine','Kevin','Laras','Mahesa','Nadia','Oscar','Putri','Rizky','Sari','Teguh','Wulan','Yusuf','Zahra','Adit','Bima','Citra','Dimas','Elsa','Farhan','Gita','Hendra']
const MKN=['nasi goreng','mie ayam','bakso','sate','gado-gado','rendang','soto','pecel']
const BQ=['kabel LAN','switch jaringan','router','modem','kabel FO','RJ45','crimping tool','tester kabel','access point','server rack','harddisk','SSD','RAM','processor','kabel USB','solder','multimeter','obeng','tang','kabel jumper']
const T568A=['Putih-Hijau','Hijau','Putih-Oranye','Biru','Putih-Biru','Oranye','Putih-Coklat','Coklat']
const T568B=['Putih-Oranye','Oranye','Putih-Hijau','Biru','Putih-Biru','Hijau','Putih-Coklat','Coklat']
const HW_SPEK=[{n:'DVD-R',v:4700},{n:'DVD-RW',v:4700},{n:'CD-R',v:700},{n:'Flashdisk 16GB',v:16000},{n:'Flashdisk 32GB',v:32000},{n:'HDD 500GB',v:500000},{n:'HDD 1TB',v:1000000},{n:'SSD 256GB',v:256000},{n:'SSD 512GB',v:512000}]
const PIN_HW=[{n:'SATA data',v:7},{n:'SATA power',v:15},{n:'DDR3 RAM',v:240},{n:'DDR4 RAM',v:288},{n:'DDR5 RAM',v:288},{n:'PCIe x16',v:164},{n:'USB Type-A',v:4},{n:'USB Type-C',v:24},{n:'VGA',v:15},{n:'HDMI',v:19},{n:'ATX 24-pin',v:24},{n:'CPU LGA1700',v:1700},{n:'CPU AM5',v:1718}]
const KEC_USB=[{n:'USB 1.1',v:12},{n:'USB 2.0',v:480},{n:'USB 3.0',v:5000},{n:'USB 3.1',v:10000},{n:'USB 3.2',v:20000},{n:'USB4',v:40000}]
const EXCEL_FN=[{n:'SUM',d:'menjumlahkan'},{n:'AVERAGE',d:'rata-rata'},{n:'COUNT',d:'menghitung angka'},{n:'MAX',d:'nilai tertinggi'},{n:'MIN',d:'nilai terendah'},{n:'COUNTA',d:'menghitung isi'}]
const SHC=[{n:'Ctrl+C',d:'Copy'},{n:'Ctrl+V',d:'Paste'},{n:'Ctrl+X',d:'Cut'},{n:'Ctrl+Z',d:'Undo'},{n:'Ctrl+Y',d:'Redo'},{n:'Ctrl+S',d:'Save'},{n:'Ctrl+B',d:'Bold'},{n:'Ctrl+I',d:'Italic'},{n:'Ctrl+U',d:'Underline'},{n:'Ctrl+A',d:'Select All'},{n:'Ctrl+F',d:'Find'},{n:'Ctrl+P',d:'Print'}]
const WCOMP=['Ribbon','Title Bar','Status Bar','Scroll Bar','Ruler','Tab Stop']
const TOPO=[{n:'Bus',k:'satu kabel backbone'},{n:'Ring',k:'melingkar'},{n:'Star',k:'hub/switch pusat'},{n:'Mesh',k:'semua terhubung'}]
const S={cur:null,att:0,max:3,ok:false,t:0,min:500,log:[]}

// ─── Generate opsi A/B/C/D/E dari jawaban benar ───
function mo(c){
let pool=[c],mag=_.abs(c)||1
let step=mag<1?.1:mag<10?1:mag<100?5:mag<1000?50:mag<10000?500:mag<100000?5000:mag<1e6?50000:100000
for(let m of[-3,-2,-1,1,2,3,4,5]){let v=typeof c==='number'?parseFloat((c+m*step).toFixed(step<1?1:0)):c+m;if(typeof c!=='number'||v>0)pool.push(v)}
let u=[...new Set(pool)].slice(0,5);while(u.length<5)u.push(typeof c==='number'?(_.abs(c)+u.length*step||1):c+u.length)
for(let i=u.length-1;i>0;i--){let j=$r(0,i);[u[i],u[j]]=[u[j],u[i]]}
let o=u.map((v,i)=>({value:v,text:typeof v==='number'&&(v%1===0)?String(v).replace(/\B(?=(\d{3})+(?!\d))/g,'.'):v.toFixed?v.toFixed(1):v,key:String.fromCharCode(65+i)})),ck=''
o.forEach(x=>{if(String(x.value).trim()===String(c).trim())ck=x.key})
if(!ck&&o.length>0)ck=o[0].key;return {options:o,correctKey:ck}}

// ═══════════════════════════════════════════════════════════════════
//  65 GENERATOR — return {type,q,a,h}
// ═══════════════════════════════════════════════════════════════════
const G={
belanja:()=>{let a=$p(BQ),b=$p(BQ.filter(x=>x!==a)),h1=$r(5,50)*1000,h2=$r(3,30)*1000,j1=$r(2,8),j2=$r(1,5),n=$p(N),t=h1*j1+h2*j2;return {type:'belanja',q:`${n} beli ${j1} ${a} Rp${h1.toLocaleString()}/bh + ${j2} ${b} Rp${h2.toLocaleString()}/bh. Total?`,a:t,h:`${j1}×${h1.toLocaleString()}+${j2}×${h2.toLocaleString()}=${t.toLocaleString()}`}},
internet:()=>{let k=$r(10,100),f=$r(100,2000),w=_.round(f/(k/8)*10)/10,n=$p(N);return {type:'internet',q:`${n} download ${f}MB ${k}Mbps. Detik? (1B=8bit,1des)`,a:w,h:`${f}×8÷${k}=${w}s`}},
kuadrat:()=>{let s=$r(2,8),l=$r(5,15),luas=l*(l+s);return {type:'persamaan_kuadrat',q:`Lab panjang ${s}m>lebar. Luas ${luas}m². Lebar?`,a:l,h:`x(x+${s})=${luas}→x=${l}`}},
spldv:()=>{let h1=$r(5,25)*1000,h2=$r(3,20)*1000,j1=$r(1,4),j2=$r(1,4),t1=h1*j1+h2*j2,j1b=$r(1,4),j2b=$r(1,4),t2=h1*j1b+h2*j2b,n=$p(N),t=$p(N.filter(x=>x!==n)),m1=$p(MKN),m2=$p(MKN.filter(x=>x!==m1));return {type:'spl',q:`${n} ${j1}${m1}+${j2}${m2}=Rp${t1.toLocaleString()}. ${t} ${j1b}${m1}+${j2b}${m2}=Rp${t2.toLocaleString()}. Harga 1 ${m1}?`,a:h1,h:'Eliminasi/substitusi'}},
barisan:()=>{let b=$r(2,6),aw=$r(10,50)*1000,beda=$r(5,20)*1000,t=aw+(b-1)*beda,n=$p(N);return {type:'barisan',q:`${n} nabung bln1=Rp${aw.toLocaleString()},+Rp${beda.toLocaleString()}/bln. Tab bln${b}?`,a:t,h:`${aw}+(${b}-1)×${beda.toLocaleString()}`}},
diskon:()=>{let h=$r(200,2000)*1000,d=$r(10,50),ak=_.round(h*(100-d)/100),n=$p(N),b=$p(['laptop','monitor','printer','server','switch']);return {type:'diskon',q:`${n} beli ${b} diskon ${d}% dari Rp${h.toLocaleString()}. Bayar?`,a:ak,h:`${100-d}%×${h.toLocaleString()}`}},
skala:()=>{let p=$r(10,30),s=$r(50,200),d=p*100/s,n=$p(N);return {type:'skala',q:`${n} gambar lab skala 1:${s}. Panjang ${p}m. Panjang denah (cm)?`,a:d,h:`${p}×100÷${s}=${d}cm`}},
statistika:()=>{let j=$r(4,8),v=[];for(let i=0;i<j;i++)v.push($r(70,100));let r=v.reduce((a,b)=>a+b,0)/j,n=$p(N);return {type:'statistika',q:`Nilai ${j} siswa: ${v.join(', ')}. Rata-rata (1des)?`,a:_.round(r*10)/10,h:`(${v.join('+')})÷${j}`}},
kecepatan:()=>{let j=$r(50,500),k=$r(30,80),w=_.round(j/k*10)/10,n=$p(N);return {type:'kecepatan',q:`${n} antar harddisk ${j}km ${k}km/jam. Jam (1des)?`,a:w,h:`${j}÷${k}=${w}jam`}},
logaritma:()=>{let b=$r(2,4),e=$r(2,6),h=_.pow(b,e),n=$p(N);return {type:'logaritma',q:`${n} analisis f(x)=${b}ˣ. x saat f(x)=${h}?`,a:e,h:`${b}^x=${h}→x=${e}`}},
trigonometri:()=>{let su=$p([30,45,60]),j=$r(10,30),t=_.round(j*_.tan(su*_.PI/180)*10)/10,n=$p(N);return {type:'trigonometri',q:`${n} lihat tiang sudut ${su}° jarak ${j}m. Tinggi? (tan${su}°=${_.tan(su*_.PI/180).toFixed(4)})`,a:t,h:`${j}×tan${su}°=${t}m`}},
deret_geo:()=>{let r=$r(2,3),j=$r(3,6),aw=$r(10,50),h=aw*_.pow(r,j-1);return {type:'deret_geometri',q:`Virus ${aw} file jam1, ${r}×/jam. File jam${j}?`,a:h,h:`U=${aw}×${r}^(${j}-1)`}},
kombinasi:()=>{let t=$r(5,10),p=$r(2,4),c=n=>n<=1?1:n*c(n-1),k=c(t)/(c(p)*c(t-p)),n=$p(N);return {type:'kombinasi',q:`${n} pilih ${p} dari ${t} org. Cara?`,a:k,h:`C(${t},${p})=${k}`}},
jualbeli:()=>{let b=$r(3,15)*1e6,u=$r(5,30),j=_.round(b*(100+u)/100),n=$p(N);return {type:'jual_beli',q:`${n} jual laptop untung ${u}% dari beli Rp${b.toLocaleString()}. Harga jual?`,a:j,h:`${100+u}%×${b.toLocaleString()}`}},
fungsi:()=>{let a=$r(2,5),b=$r(10,50)*1000,x=$r(5,20),h=a*x+b,n=$p(N),p=$p(['gantungan kunci','stiker','cover hp','kabel data']);return {type:'fungsi',q:`${n} bikin ${p}. f(x)=${a}x+${b.toLocaleString()}, x=${x}. Biaya?`,a:h,h:`${a}×${x}+${b.toLocaleString()}`}},
// ─── TKJ ─────────────────────────────────────────────────────────
kabel_lan:()=>{let s=$p(['T568A','T568B']),arr=s==='T568A'?T568A:T568B,w=$p(arr),no=arr.indexOf(w)+1;return {type:'kabel_lan',q:`${$p(N)} crimping ${s}. Urutan "${w}"?`,a:no,h:`${s}: ${arr.join(', ')}. ${w}=${no}`}},
kabel_pasang:()=>{return {type:'kabel_pasang',q:`${$p(N)} belajar UTP Cat5e. Pasang kabel twisted pair?`,a:4,h:'UTP=4 pasang=8 kabel'}},
biner_desimal:()=>{let bit=$r(4,8),bin='';for(let i=0;i<bit;i++)bin+=$p(['0','1']);let des=parseInt(bin,2);return {type:'biner_ke_desimal',q:`${$p(N)} konversi biner ${bin} (${bit}bit) ke desimal?`,a:des,h:`${bin}(2)=${des}(10)`}},
desimal_biner:()=>{let des=$r(10,255),bin=des.toString(2);return {type:'desimal_ke_biner',q:`${$p(N)} konversi desimal ${des} ke biner?`,a:parseInt(bin),h:`${des}(10)=${bin}(2)`}},
subnet_host:()=>{let p=$p([24,25,26,27,28,29,30]),h=_.pow(2,32-p)-2;return {type:'subnet_host',q:`${$p(N)} setting /${p}. Host valid?`,a:h,h:`2^(32-${p})-2=${h.toLocaleString()}`}},
kelas_a:()=>{let h=_.pow(2,24)-2;return {type:'kelas_ip',q:`${$p(N)} IP kelas A. Host maksimal per jaringan?`,a:h,h:`2^24-2=${h.toLocaleString()}`}},
kelas_b:()=>{let h=_.pow(2,16)-2;return {type:'kelas_ip',q:`${$p(N)} IP kelas B. Host maksimal per jaringan?`,a:h,h:`2^16-2=${h.toLocaleString()}`}},
kelas_c:()=>{let h=_.pow(2,8)-2;return {type:'kelas_ip',q:`${$p(N)} IP kelas C. Host maksimal per jaringan?`,a:h,h:`2^8-2=${h}`}},
kapasitas:()=>{let hw=$p(HW_SPEK),j=$r(2,5);return {type:'kapasitas_hardware',q:`${$p(N)} punya ${j} ${hw.n} @${hw.v}MB. Total MB?`,a:hw.v*j,h:`${hw.v}×${j}`}},
pin_hw:()=>{let hw=$p(PIN_HW);return {type:'pin_hardware',q:`${$p(N)} pasang kabel ${hw.n}. Jumlah pin?`,a:hw.v,h:`${hw.n}=${hw.v} pin`}},
usb_cepat:()=>{let usb=$p(KEC_USB),n=$r(2,10),f=_.round(usb.v*n/8);return {type:'kecepatan_usb',q:`${$p(N)} transfer ${f}MB via ${usb.n} ${usb.v}Mbps. Detik?`,a:n,h:`${f}×8÷${usb.v}=${n}s`}},
excel_fn:()=>{let fn=$p(EXCEL_FN),c=$r(3,10),s=$r(1,5),e=s+c-1;return {type:'excel_formula',q:`${$p(N)} =${fn.n}(A${s}:A${e}) utk ${fn.d}. Cell?`,a:c,h:`A${s}:A${e}=${c} cell`}},
excel_hitung:()=>{let c=$r(3,6),v=[];for(let i=0;i<c;i++)v.push($r(10,99));let op=$p(['SUM','PRODUCT','AVERAGE']),h=op==='SUM'?v.reduce((a,b)=>a+b,0):op==='PRODUCT'?v.reduce((a,b)=>a*b,1):_.round(v.reduce((a,b)=>a+b,0)/c*10)/10;return {type:'excel_hitung',q:`Excel data: ${v.join(', ')} =${op}(A1:A${c})?`,a:h,h:`=${op}(${v.join(',')})=${h}`}},
excel_dimensi:()=>{let v=$p([{t:'baris',v:1048576},{t:'kolom',v:16384}]);return {type:'excel_dimensi',q:`${$p(N)} Excel. Maks ${v.t} per worksheet?`,a:v.v,h:`${v.t}=${v.v.toLocaleString()}`}},
shortcut:()=>{let sc=$p(SHC);return {type:'shortcut',q:`${$p(N)} ujian: ${sc.n}=${sc.d}. Total shortcut standar?`,a:SHC.length,h:`${SHC.length} shortcut: ${SHC.map(s=>s.n).join(', ')}`}},
word_komp:()=>{return {type:'word_komponen',q:`${$p(N)} hafal komponen Word: ${WCOMP.join(', ')}. Total?`,a:WCOMP.length,h:`${WCOMP.length} komponen`}},
ram_spes:()=>{let t=$p([{n:'DDR3',p:240},{n:'DDR4',p:288},{n:'DDR5',p:288}]),j=$r(1,4);return {type:'ram_spesifikasi',q:`${$p(N)} pasang ${j}×${t.n} @${t.p} pin. Total pin?`,a:t.p*j,h:`${t.p}×${j}=${t.p*j}`}},
ip_range:()=>{return {type:'ip_range',q:`${$p(N)} setting 192.168.1.x/24. Total alamat IP?`,a:256,h:'/24=256 (0-255)'}},
crimping:()=>{let st=$r(6,10),jk=$r(3,10);return {type:'crimping',q:`${$p(N)} crimping ${jk} kabel, ${st} langkah/kabel. Total?`,a:st*jk,h:`${st}×${jk}=${st*jk}`}},
listrik:()=>{let w=$r(50,100)*10,k=$r(3,8),r=_.round(w/k);return {type:'power_supply',q:`${$p(N)} daya ${w}W ${k} komponen. Rata-rata watt?`,a:r,h:`${w}÷${k}=${r}W`}},
resistor:()=>{let g=$p([4,5]);return {type:'resistor',q:`${$p(N)} baca resistor ${g} gelang. Digit signifikan?`,a:g===4?2:3,h:`${g} gelang: ${g===4?'2 digit':'3 digit'}`}},
topologi:()=>{return {type:'topologi',q:`${$p(N)} belajar topologi: Bus, Ring, Star, Mesh. Total topologi dasar?`,a:TOPO.length,h:`${TOPO.length} topologi dasar`}},
osi:()=>{return {type:'osi_layer',q:`${$p(N)} OSI Layer. Total layer?`,a:7,h:'OSI=7 layer'}},
ipv6:()=>{return {type:'ipv6',q:`${$p(N)} IPv6. Total bit alamat?`,a:128,h:'IPv6=128bit'}},
mac:()=>{return {type:'mac_address',q:`${$p(N)} MAC (XX:XX:XX:XX:XX:XX). Digit hex?`,a:12,h:'6 pasang=12 hex'}},
cable_len:()=>{let j=$r(10,100),k=$r(2,5);return {type:'panjang_kabel',q:`${$p(N)} pasang ${k} PC ke switch ${j}m. Total kabel?`,a:j*k,h:`${j}×${k}=${j*k}m`}},
ping:()=>{let pkt=$r(4,10),bk=$r(2,pkt-1);return {type:'packet_loss',q:`Ping ${pkt} packet, ${bk} reply. Loss %?`,a:_.round((pkt-bk)/pkt*100),h:`Loss ${pkt-bk}/${pkt}`}},
bandwidth:()=>{let bw=$r(10,100),usr=$r(5,20),per=_.round(bw/usr*10)/10;return {type:'bandwidth',q:`${bw}Mbps ${usr} user. Mbps/user (1des)?`,a:per,h:`${bw}÷${usr}=${per}Mbps`}},
win_short:()=>{return {type:'windows_shortcut',q:`${$p(N)} shortcut Win standar. Total?`,a:10,h:'10+ shortcut Win'}},
ip_host:()=>{return {type:'ip_host_valid',q:`${$p(N)} 192.168.1.0/24. Host valid?`,a:254,h:'256-2=254'}},
database:()=>{return {type:'total_soal',q:`${$p(N)} TKJ Challenge. Ada ${Object.keys(G).length} jenis soal. ${$p(N)} jawab total jenis soal.`,a:Object.keys(G).length,h:`${Object.keys(G).length} jenis soal`}},
// ═══════════════════════════════════════════════════════════════════
//  MATEMATIKA LINEAR & LAINNYA (tambah di sini kalo mau nambah)
// ═══════════════════════════════════════════════════════════════════
plsv:()=>{let a=$r(2,10),b=$r(1,20),c=a*$r(2,10)+b,x=(c-b)/a;return {type:'plsv',q:`Selesaikan: ${a}x + ${b} = ${c}. Nilai x?`,a:x,h:`x = (${c}-${b})/${a} = ${x}`}},
gradien:()=>{let x1=$r(1,10),x2=$r(11,20),y1=$r(1,15),y2=y1+$r(2,12),g=(y2-y1)/(x2-x1);return {type:'gradien',q:`Gradien garis melalui (${x1},${y1}) dan (${x2},${y2})?`,a:g,h:`m = (${y2}-${y1})/(${x2}-${x1}) = ${g}`}},
persamaan_garis:()=>{let m=$r(2,8),c=$r(1,15),x=$r(2,10),y=m*x+c;return {type:'persamaan_garis',q:`Garis y = ${m}x + ${c}. x = ${x}, nilai y?`,a:y,h:`y = ${m}×${x} + ${c} = ${y}`}},
determinan:()=>{let a=$r(1,9),b=$r(1,9),c=$r(1,9),d=$r(1,9),det=a*d-b*c;return {type:'determinan',q:`Determinan [[${a},${b}],[${c},${d}]]?`,a:det,h:`(${a}×${d})-(${b}×${c}) = ${det}`}},
tambah_matriks:()=>{let a=$r(1,9),b=$r(1,9),c=$r(1,9),d=$r(1,9),e=$r(1,9),f=$r(1,9),g=$r(1,9),h=$r(1,9),h1=a+e;return {type:'penjumlahan_matriks',q:`[[${a},${b}],[${c},${d}]]+[[${e},${f}],[${g},${h}]]? (baris1kolom1)`,a:h1,h:`${a}+${e} = ${h1}`}},
kali_matriks:()=>{let a=$r(1,5),b=$r(1,5),c=$r(1,5),d=$r(1,5),e=$r(1,5),f=$r(1,5),g=$r(1,5),h=$r(1,5);let h1=a*e+b*g;return {type:'perkalian_matriks',q:`[[${a},${b}],[${c},${d}]]×[[${e},${f}],[${g},${h}]]? (baris1kolom1)`,a:h1,h:`(${a}×${e})+(${b}×${g}) = ${h1}`}},
pertidaksamaan:()=>{let a=$r(2,8),b=$r(5,25),c=$r(30,80),x=_.floor((c-b)/a);return {type:'pertidaksamaan',q:`${a}x+${b}≤${c}. Nilai x maksimal?`,a:x,h:`x≤(${c}-${b})/${a}=${x}`}},
fungsi_kuadrat:()=>{let a=$r(2,5),h=$r(1,8),k=$r(1,15),xp=h;return {type:'fungsi_kuadrat',q:`f(x)=${a}(x-${h})²+${k}. Sumbu simetri?`,a:xp,h:`x = ${h}`}},
akar_kuadrat:()=>{let a=$r(2,5),b=$r(4,20),c=$r(2,15),jumlah=-b/a;return {type:'akar_kuadrat',q:`${a}x²+${b}x+${c}=0. Jumlah akar (x1+x2)?`,a:jumlah,h:`-${b}/${a} = ${jumlah}`}},
mutlak:()=>{let a=$r(2,5),c=$r(10,25),b=$r(1,Math.floor((c-1)/a)),x=(c-b)/a;return {type:'nilai_mutlak',q:`|${a}x+${b}|=${c}. Nilai x positif?`,a:x,h:`(${c}-${b})/${a} = ${x}`}},
perbandingan:()=>{let a=$r(3,12),b=$r(2,8),c=a*$r(2,5),d=c*b/a;return {type:'perbandingan',q:`${a}:${b}=${c}:x. Nilai x?`,a:d,h:`x=(${b}×${c})/${a}=${d}`}},
irisan_himpunan:()=>{let total=$r(20,50),a=$r(10,total-5),b=$r(5,a-1),irisan=$r(2,Math.min(b-1,a));return {type:'irisan_himpunan',q:`${total} siswa: ${a} suka TKJ, ${b} suka MM, ${irisan} keduanya. Hanya TKJ?`,a:a-irisan,h:`${a}-${irisan}=${a-irisan}`}},
dot_product:()=>{let x1=$r(1,8),y1=$r(1,8),x2=$r(1,8),y2=$r(1,8),dot=x1*x2+y1*y2;return {type:'dot_product',q:`a=(${x1},${y1}), b=(${x2},${y2}). a·b?`,a:dot,h:`(${x1}×${x2})+(${y1}×${y2}) = ${dot}`}},
panjang_vektor:()=>{let x=$r(3,12),y=$r(4,16),panj=_.round(_.sqrt(x*x+y*y)*10)/10;return {type:'panjang_vektor',q:`Vektor (${x},${y}). Panjang? (1des)`,a:panj,h:`√(${x*x}+${y*y}) = ${panj}`}},
fungsi_invers:()=>{let a=$r(2,7),b=$r(3,15),y=$r(10,50),x=_.round((y-b)/a*10)/10;return {type:'fungsi_invers',q:`f(x)=${a}x+${b}. f⁻¹(${y})? (1des)`,a:x,h:`(${y}-${b})/${a} = ${x}`}},
barisan_geo:()=>{let a1=$r(2,10),r=$r(2,5),n=$r(4,7),un=a1*_.pow(r,n-1);return {type:'barisan_geometri',q:`Geo: ${a1}, ${a1*r}, ${a1*r*r}... Suku${n}?`,a:un,h:`U${n}=${a1}×${r}^(${n}-1)=${un}`}},
peluang:()=>{let total=$r(10,30),favor=$r(2,total-1),p=_.round(favor/total*100);return {type:'peluang',q:`${total} siswa, ${favor} suka TKJ. Peluang pilih suka TKJ (%)?`,a:p,h:`${favor}/${total}×100% = ${p}%`}},
bunga:()=>{let pokok=$r(1,10)*1000000,persen=$r(3,12),bulan=$r(3,12),bunga=_.round(pokok*persen/100*bulan/12);return {type:'bunga_tabungan',q:`${$p(N)} nabung Rp${pokok.toLocaleString()} ${persen}%/thn. Bunga ${bulan}bln?`,a:bunga,h:`${pokok.toLocaleString()}×${persen}%×${bulan}/12=${bunga.toLocaleString()}`}},
suhu:()=>{let c=$r(10,100),f=_.round(c*9/5+32);return {type:'konversi_suhu',q:`${c}°C ke °F? (Rumus: °C×9/5+32)`,a:f,h:`${c}×9/5+32 = ${f}°F`}},
// ═══════════════════════════════════════════════════════════════════
//  TAMBAHAN PERSAMAAN LINEAR & ALJABAR LANJUTAN
// ═══════════════════════════════════════════════════════════════════
spl_3var:()=>{let x=$r(2,8),y=$r(2,8),z=$r(2,8),a1=$r(1,5),b1=$r(1,5),c1=$r(1,5),d1=a1*x+b1*y+c1*z,a2=$r(1,5),b2=$r(1,5),c2=$r(1,5),d2=a2*x+b2*y+c2*z,a3=$r(1,5),b3=$r(1,5),c3=$r(1,5),d3=a3*x+b3*y+c3*z;return {type:'spl_3_variabel',q:`SPDV 3 var: ${a1}x+${b1}y+${c1}z=${d1}, ${a2}x+${b2}y+${c2}z=${d2}, ${a3}x+${b3}y+${c3}z=${d3}. Nilai x+y+z?`,a:x+y+z,h:`x=${x},y=${y},z=${z}→${x+y+z}`}},
garis_tegak:()=>{let m1=$r(2,8),m2=-1/m1,x=$r(1,10),y=m1*x+$r(1,10);return {type:'garis_tegak_lurus',q:`Garis y=${m1}x+${$r(1,10)}. Gradien garis tegak lurus?`,a:m2,h:`m1×m2=-1→m2=-1/${m1}=${m2}`}},
jarak_dua_titik:()=>{let x1=$r(1,10),y1=$r(1,10),x2=x1+$r(3,12),y2=y1+$r(3,12),j=_.round(_.sqrt((x2-x1)**2+(y2-y1)**2)*10)/10;return {type:'jarak_titik',q:`Jarak (${x1},${y1}) ke (${x2},${y2})? (1des)`,a:j,h:`√((${x2}-${x1})²+(${y2}-${y1})²)=${j}`}},
titik_tengah:()=>{let x1=$r(2,10),y1=$r(2,10),x2=x1+$r(4,16),y2=y1+$r(4,16),tm=[(x1+x2)/2,(y1+y2)/2];return {type:'titik_tengah',q:`Titik tengah (${x1},${y1}) dan (${x2},${y2})?`,a:tm[0],h:`((${x1}+${x2})/2,(${y1}+${y2})/2)=(${tm[0]},${tm[1]})`}},
lingkaran_luas:()=>{let r=$r(5,20),l=_.round(Math.PI*r*r*10)/10;return {type:'lingkaran_luas',q:`Lingkaran r=${r}cm. Luas? (π=3.14,1des)`,a:l,h:`π×${r}²=${l}cm²`}},
lingkaran_keliling:()=>{let d=$r(10,40),k=_.round(Math.PI*d*10)/10;return {type:'lingkaran_keliling',q:`Lingkaran d=${d}cm. Keliling? (π=3.14,1des)`,a:k,h:`π×${d}=${k}cm`}},
eksponen:()=>{let a=$r(2,5),m=$r(2,6),n=$r(2,6),h=a**(m+n);return {type:'eksponen',q:`${a}^${m} × ${a}^${n} = ?`,a:h,h:`${a}^(${m}+${n})=${a}^${m+n}=${h}`}},
log_sifat:()=>{let a=$r(2,5),x=$r(2,10),y=$r(2,10),h=x*y;return {type:'logaritma_sifat',q:`²log ${x} + ²log ${y} = ²log ?`,a:h,h:`²log(${x}×${y})=²log${h}`}},
trig_sin:()=>{let s=$p([30,45,60]),val={30:0.5,45:0.707,60:0.866};return {type:'trigonometri_sin',q:`sin ${s}° = ? (2des)`,a:val[s],h:`sin ${s}°=${val[s]}`}},
trig_cos:()=>{let s=$p([30,45,60]),val={30:0.866,45:0.707,60:0.5};return {type:'trigonometri_cos',q:`cos ${s}° = ? (2des)`,a:val[s],h:`cos ${s}°=${val[s]}`}},
limit:()=>{let a=$r(2,8),h=a*a;return {type:'limit',q:`lim x→${a} dari x² = ?`,a:h,h:`${a}²=${h}`}},
turunan_pangkat:()=>{let n=$r(3,8),a=$r(2,5),c=n*a,x=$r(1,5),h=c*Math.pow(x,n-2);return {type:'turunan',q:`f(x)=${a}x^${n}. f'(${x}) = ?`,a:h,h:`f'(x)=${n*a}x^${n-1},f'(${x})=${h}`}},
integral_pangkat:()=>{let n=$r(2,6),a=$r(2,5),c=a/(n+1),x=$r(1,5),h=c*Math.pow(x,n+1);return {type:'integral',q:`∫${a}x^${n}dx dari 0 ke ${x} = ? (2des)`,a:_.round(h*100)/100,h:`[${a}/(${n}+1)x^${n+1}]₀^${x}=${_.round(h*100)/100}`}},
program_linear:()=>{let x=$r(5,20),y=$r(5,20),a=$r(2,8),b=$r(2,8),z=a*x+b*y;return {type:'program_linear',q:`Maks z=${a}x+${b}y. Jika x=${x},y=${y}, maka z=?`,a:z,h:`${a}×${x}+${b}×${y}=${z}`}},
matriks_transpose:()=>{let a=$r(1,9),b=$r(1,9),c=$r(1,9),d=$r(1,9),e=$r(1,9),f=$r(1,9);return {type:'matriks_transpose',q:`[[${a},${b}],[${c},${d}],[${e},${f}]]ᵀ. Elemen baris2kolom1?`,a:c,h:`Transpose: baris↔kolom, posisi=${c}`}},
vektor_selisih:()=>{let x1=$r(2,10),y1=$r(2,10),x2=$r(2,10),y2=$r(2,10),sx=x2-x1,sy=y2-y1;return {type:'vektor_selisih',q:`a=(${x1},${y1}), b=(${x2},${y2}). b-a = ?`,a:sx,h:`(${x2}-${x1},${y2}-${y1})=(${sx},${sy})`}},
komposisi_fungsi:()=>{let f=$r(2,5),g=$r(2,5),x=$r(2,10),h=f*(g*x+2)+3;return {type:'komposisi_fungsi',q:`f(x)=${f}x+3, g(x)=${g}x+2. (f∘g)(x) untuk x=${x}?`,a:h,h:`f(g(${x}))=f(${g*x+2})=${h}`}},
barisan_arit:()=>{let a=$r(5,20),b=$r(2,8),n=$r(5,15),un=a+(n-1)*b;return {type:'barisan_aritmetika',q:`Arit: ${a},${a+b},${a+2*b}... Suku-${n}?`,a:un,h:`U${n}=${a}+(${n}-1)×${b}=${un}`}},
jumlah_deret:()=>{let n=$r(5,15),a=$r(1,5),b=$r(1,5),un=a+(n-1)*b,s=n*(a+un)/2;return {type:'jumlah_deret_arit',q:`Deret arit: a=${a},b=${b},n=${n}. Sn = ?`,a:s,h:`S${n}=${n}/2×(${a}+${un})=${s}`}},
peluang_koin:()=>{let n=$r(2,6),total=Math.pow(2,n),favor=$r(1,total-1);return {type:'peluang_koin',q:`${n} koin dilempar. Peluang muncul ${favor} angka? (desimal,2ang)`,a:_.round(favor/total*100)/100,h:`${favor}/${total}=${_.round(favor/total*100)/100}`}},
statistika_modus:()=>{let data=[],mod=$r(10,50);for(let i=0;i<$r(5,8);i++)data.push($r(10,50));data.push(mod,mod,mod);let mode=mod;return {type:'statistika_modus',q:`Data: ${data.join(',')}. Modus?`,a:mode,h:`${mode} muncul 3x (terbanyak)`}},
statistika_median:()=>{let j=$r(5,9),v=[];for(let i=0;i<j;i++)v.push($r(10,99));v.sort((a,b)=>a-b);let med=j%2===1?v[Math.floor(j/2)]:_.round((v[j/2-1]+v[j/2])/2);return {type:'statistika_median',q:`Data: ${v.join(',')}. Median?`,a:med,h:`Nilai tengah=${med}`}},
korelasi:()=>{let r=_.round($r(-9,9)/10,1);return {type:'korelasi',q:`Koefisien korelasi r=${r}. Hubungan?`,a:r,h:`r=${r}: ${Math.abs(r)>0.7?'kuat':Math.abs(r)>0.4?'sedang':'lemah'}`}},
sigma:()=>{let n=$r(3,8),sum=0;for(let i=1;i<=n;i++)sum+=i*i;return {type:'notasi_sigma',q:`Σ(i=1 to ${n}) dari i² = ?`,a:sum,h:`1²+2²+...+${n}²=${sum}`}},
transformasi:()=>{let x=$r(2,10),y=$r(2,10),a=$r(1,5),b=$r(1,5),tx=x+a,ty=y+b;return {type:'translasi',q:`Titik (${x},${y}) ditranslasi (${a},${b}). Bayangan? (x)`,a:tx,h:`(${x}+${a},${y}+${b})=(${tx},${ty})`}},
dilatasi:()=>{let x=$r(2,8),y=$r(2,8),k=$r(2,5),dx=x*k,dy=y*k;return {type:'dilatasi',q:`(${x},${y}) didilatasi faktor ${k}. Bayangan x?`,a:dx,h:`(${k}×${x},${k}×${y})=(${dx},${dy})`}},
refleksi:()=>{let x=$r(2,10),y=$r(2,10);return {type:'refleksi',q:`(${x},${y}) dicerminkan thd sumbu Y. Bayangan x?`,a:-x,h:`(-${x},${y})`}},
rotasi:()=>{let x=$r(3,10),y=$r(3,10);return {type:'rotasi',q:`(${x},${y}) dirotasi 90° berlawanan jarum jam. Bayangan x?`,a:-y,h:`(-${y},${x})`}},
bangun_ruang_volume:()=>{let s=$r(5,15),v=s*s*s;return {type:'volume_kubus',q:`Kubus sisi ${s}cm. Volume?`,a:v,h:`${s}³=${v}cm³`}},
bangun_ruang_luas:()=>{let s=$r(5,15),l=6*s*s;return {type:'luas_kubus',q:`Kubus sisi ${s}cm. Luas permukaan?`,a:l,h:`6×${s}²=${l}cm²`}},
tabung_volume:()=>{let r=$r(5,15),t=$r(10,30),v=_.round(Math.PI*r*r*t);return {type:'volume_tabung',q:`Tabung r=${r}cm,t=${t}cm. Volume? (π=3.14)`,a:v,h:`3.14×${r}²×${t}=${v}cm³`}},
kerucut_volume:()=>{let r=$r(5,15),t=$r(10,30),v=_.round(Math.PI*r*r*t/3);return {type:'volume_kerucut',q:`Kerucut r=${r}cm,t=${t}cm. Volume? (π=3.14)`,a:v,h:`⅓×3.14×${r}²×${t}=${v}cm³`}},
bola_volume:()=>{let r=$r(5,15),v=_.round(4/3*Math.PI*Math.pow(r,3));return {type:'volume_bola',q:`Bola r=${r}cm. Volume? (π=3.14)`,a:v,h:`4/3×3.14×${r}³=${v}cm³`}},
pythagoras:()=>{let a=$r(3,12),b=$r(4,16),c=_.round(_.sqrt(a*a+b*b)*10)/10;return {type:'pythagoras',q:`Segitiga siku-siku: alas=${a},tinggi=${b}. Sisi miring? (1des)`,a:c,h:`√(${a}²+${b}²)=${c}`}},
segitiga_luas:()=>{let a=$r(5,20),t=$r(5,20),l=a*t/2;return {type:'luas_segitiga',q:`Segitiga alas=${a}cm,tinggi=${t}cm. Luas?`,a:l,h:`½×${a}×${t}=${l}cm²`}},
trapesium_luas:()=>{let a=$r(5,15),b=a+$r(3,10),t=$r(5,15),l=(a+b)*t/2;return {type:'luas_trapesium',q:`Trapesium sisi sejajar ${a}cm,${b}cm,tinggi=${t}cm. Luas?`,a:l,h:`½×(${a}+${b})×${t}=${l}cm²`}},
belah_ketupat:()=>{let d1=$r(10,30),d2=$r(10,30),l=d1*d2/2;return {type:'luas_belah_ketupat',q:`Belah ketupat d1=${d1}cm,d2=${d2}cm. Luas?`,a:l,h:`½×${d1}×${d2}=${l}cm²`}},
layang_layang:()=>{let d1=$r(10,30),d2=$r(10,30),l=d1*d2/2;return {type:'luas_layang_layang',q:`Layang-layang d1=${d1}cm,d2=${d2}cm. Luas?`,a:l,h:`½×${d1}×${d2}=${l}cm²`}},
jajargenjang_luas:()=>{let a=$r(5,20),t=$r(5,15),l=a*t;return {type:'luas_jajargenjang',q:`Jajargenjang alas=${a}cm,tinggi=${t}cm. Luas?`,a:l,h:`${a}×${t}=${l}cm²`}},
persegipanjang_keliling:()=>{let p=$r(10,30),l=$r(5,20),k=2*(p+l);return {type:'keliling_persegipanjang',q:`Persegipanjang p=${p}cm,l=${l}cm. Keliling?`,a:k,h:`2×(${p}+${l})=${k}cm`}},
persamaan_kuadrat_akar:()=>{let x1=$r(2,10),x2=$r(2,10),b=-(x1+x2),c=x1*x2;return {type:'persamaan_kuadrat_dari_akar',q:`Akar-akar ${x1} dan ${x2}. Persamaan? (koef b)`,a:b,h:`x²-(${x1}+${x2})x+${x1}×${x2}=0→b=${b}`}},
diskriminan:()=>{let a=$r(1,5),b=$r(1,10),c=$r(1,10),d=b*b-4*a*c;return {type:'diskriminan',q:`${a}x²+${b}x+${c}=0. Diskriminan D=?`,a:d,h:`${b}²-4×${a}×${c}=${d}`}},
sumbu_simetri:()=>{let a=$r(1,5),b=$r(2,10),x=_.round(-b/(2*a)*10)/10;return {type:'sumbu_simetri',q:`f(x)=${a}x²+${b}x+${$r(1,10)}. Sumbu simetri? (1des)`,a:x,h:`x=-${b}/(2×${a})=${x}`}},
nilai_ekstrim:()=>{let a=$r(1,5),b=$r(2,10),c=$r(1,10),xe=-b/(2*a),ye=a*xe*xe+b*xe+c;yE=_.round(ye*10)/10;return {type:'nilai_ekstrim',q:`f(x)=${a}x²+${b}x+${c}. Nilai ekstrim? (1des)`,a:yE,h:`f(${xe.toFixed(2)})=${yE}`}},
fungsi_naik:()=>{let a=$r(1,5),b=$r(-10,-1),c=$r(1,10),x=-b/(2*a);return {type:'fungsi_naik_turun',q:`f(x)=${a}x²+${b}x+${c}. Fungsi naik saat x>?`,a:_.round(x*10)/10,h:`x>-${b}/(2×${a})=${_.round(x*10)/10}`}},
garis_singgung:()=>{let a=$r(1,4),x=$r(1,5),m=2*a*x,y=a*x*x;return {type:'garis_singgung',q:`f(x)=${a}x². Gradien garis singgung di x=${x}?`,a:m,h:`f'(x)=${2*a}x,f'(${x})=${m}`}},
barisan_fibonacci:()=>{let n=$r(6,12),fib=[1,1];for(let i=2;i<n;i++)fib.push(fib[i-1]+fib[i-2]);return {type:'fibonacci',q:`Fibonacci: 1,1,2,3,5... Suku-${n}?`,a:fib[n-1],h:`U${n}=${fib[n-1]}`}},
pertidaksamaan_pangkat:()=>{let a=$r(2,5),n=$r(2,4),c=Math.pow(a,n),x=a+1;return {type:'pertidaksamaan_pangkat',q:`x^${n}>${c}. Nilai x bulat positif terkecil?`,a:x,h:`x>${a}→x=${x}`}},
log_persamaan:()=>{let a=$r(2,5),x=$r(2,10),h=a*a;return {type:'persamaan_logaritma',q:`²log x = ${a}. Nilai x?`,a:h,h:`x=2^${a}=${h}`}},
trig_identitas:()=>{return {type:'identitas_trigonometri',q:`sin²x + cos²x = ?`,a:1,h:'Identitas Pythagoras=1'}},
sudut_istimewa:()=>{let s=$p([0,30,45,60,90]),val={0:0,30:0.5,45:0.707,60:0.866,90:1};return {type:'sudut_istimewa',q:`sin ${s}° = ? (3des)`,a:val[s],h:`sin ${s}°=${val[s]}`}},
aturan_sin:()=>{let A=$r(30,60),a=$r(5,15),B=$r(30,60),b=_.round(a*Math.sin(B*Math.PI/180)/Math.sin(A*Math.PI/180)*10)/10;return {type:'aturan_sinus',q:`ΔABC: A=${A}°,a=${a}cm,B=${B}°. Panjang b? (1des)`,a:b,h:`b=${a}×sin${B}°/sin${A}°=${b}`}},
aturan_cos:()=>{let a=$r(5,15),b=$r(5,15),C=$p([60,90,120]),c=_.round(_.sqrt(a*a+b*b-2*a*b*Math.cos(C*Math.PI/180))*10)/10;return {type:'aturan_kosinus',q:`ΔABC: a=${a},b=${b},C=${C}°. Panjang c? (1des)`,a:c,h:`c=√(${a}²+${b}²-2×${a}×${b}×cos${C}°)=${c}`}},
koordinat_kutub:()=>{let r=$r(5,15),th=$p([30,45,60,90]),x=_.round(r*Math.cos(th*Math.PI/180)*10)/10;return {type:'koordinat_kutub',q:`P(${r},${th}°) ke kartesius. Nilai x? (1des)`,a:x,h:`x=${r}×cos${th}°=${x}`}},
limit_trigo:()=>{let a=$r(2,5);return {type:'limit_trigonometri',q:`lim x→0 sin(${a}x)/x = ?`,a:a,h:`=${a}`}},
turunan_trigo:()=>{let x=$r(1,5);return {type:'turunan_trigonometri',q:`f(x)=sin x. f'(π/2) = ?`,a:0,h:'cos(π/2)=0'}},
integral_trigo:()=>{let a=$r(1,5),b=$r(1,5);return {type:'integral_trigonometri',q:`∫sin x dx dari 0 ke π = ?`,a:2,h:'[-cos x]₀^π=2'}},
luas_daerah:()=>{let a=$r(1,4),b=$r(5,10),h=a*b+b*b/2-a*a/2;return {type:'luas_daerah',q:`Luas antara y=${a}x dan y=${b} dari x=0 ke x=${a}? (1des)`,a:_.round(h*10)/10,h:`∫(${b}-${a}x)dx=${_.round(h*10)/10}`}},
volume_putar:()=>{let r=$r(2,6),h=$r(5,15),v=_.round(Math.PI*r*r*h);return {type:'volume_benda_putar',q:`y=${r} diputar 0≤x≤${h}. Volume? (π=3.14)`,a:v,h:`π×${r}²×${h}=${v}`}},
// ═══════════════════════════════════════════════════════════════════
//  TAMBAHAN SOAL TKJ / JARINGAN (LEBIH PADAT)
// ═══════════════════════════════════════════════════════════════════
subnet_mask:()=>{let cidr=$p([24,25,26,27,28,29,30]),octets=[255,255,255,0],bits=cidr-24,mask=255-Math.pow(2,8-bits)+1;if(cidr>=24&&cidr<32){octets[3]=256-Math.pow(2,32-cidr)}else if(cidr>=16&&cidr<24){octets[2]=256-Math.pow(2,24-cidr)}else if(cidr>=8&&cidr<16){octets[1]=256-Math.pow(2,16-cidr)}return {type:'subnet_mask',q:`CIDR /${cidr}. Subnet mask?`,a:octets.join('.'),h:`/${cidr}=${octets.join('.')}`}},
network_addr:()=>{let ip=[192,168,$r(1,254),$r(1,254)],cidr=24,net=[ip[0],ip[1],ip[2],0];return {type:'network_address',q:`IP ${ip.join('.')}/${cidr}. Network address?`,a:net.join('.'),h:`Network=${net.join('.')}`}},
broadcast_addr:()=>{let ip=[192,168,$r(1,254),$r(1,254)],cidr=24,broad=[ip[0],ip[1],ip[2],255];return {type:'broadcast_address',q:`IP ${ip.join('.')}/${cidr}. Broadcast address?`,a:broad.join('.'),h:`Broadcast=${broad.join('.')}`}},
first_host:()=>{let ip=[192,168,$r(1,254),$r(1,254)],cidr=24,first=[ip[0],ip[1],ip[2],1];return {type:'first_host',q:`IP ${ip.join('.')}/${cidr}. Host pertama?`,a:first.join('.'),h:`Host pertama=${first.join('.')}`}},
last_host:()=>{let ip=[192,168,$r(1,254),$r(1,254)],cidr=24,last=[ip[0],ip[1],ip[2],254];return {type:'last_host',q:`IP ${ip.join('.')}/${cidr}. Host terakhir?`,a:last.join('.'),h:`Host terakhir=${last.join('.')}`}},
ip_classful:()=>{let cls=$p(['A','B','C']),ranges={'A':[1,126],'B':[128,191],'C':[192,223]},r=ranges[cls],ip=[r[0]+$r(0,r[1]-r[0]),$r(0,255),$r(0,255),$r(1,254)];return {type:'kelas_ip_classful',q:`IP ${ip.join('.')}. Kelas?`,a:cls,h:`Kelas ${cls}: ${r[0]}-${r[1]}`}},
private_ip:()=>{let priv=$p(['A','B','C']),ranges={'A':['10.x.x.x','10.0.0.0-10.255.255.255'],'B':['172.16.x.x-172.31.x.x','172.16.0.0-172.31.255.255'],'C':['192.168.x.x','192.168.0.0-192.168.255.255']};return {type:'private_ip_range',q:`IP privat kelas ${priv}? (range utama)`,a:priv,h:`Kelas ${priv}: ${ranges[priv][1]}`}},
loopback:()=>{return {type:'loopback_address',q:`IP loopback untuk testing?`,a:'127.0.0.1',h:'127.0.0.1 = localhost'}},
apiipa:()=>{return {type:'apiipa',q:`APIPA (Automatic Private IP Addressing) range?`,a:'169.254.x.x',h:'169.254.0.0-169.254.255.255'}},
dns_port:()=>{return {type:'dns_port',q:`DNS menggunakan port?`,a:53,h:'DNS=port 53 (UDP/TCP)'}},
http_port:()=>{return {type:'http_port',q:`HTTP default port?`,a:80,h:'HTTP=80, HTTPS=443'}},
ssh_port:()=>{return {type:'ssh_port',q:`SSH default port?`,a:22,h:'SSH=22'}},
telnet_port:()=>{return {type:'telnet_port',q:`Telnet default port?`,a:23,h:'Telnet=23'}},
ftp_port:()=>{return {type:'ftp_port',q:`FTP data port?`,a:20,h:'FTP=20(data),21(control)'}},
smtp_port:()=>{return {type:'smtp_port',q:`SMTP port?`,a:25,h:'SMTP=25'}},
pop3_port:()=>{return {type:'pop3_port',q:`POP3 port?`,a:110,h:'POP3=110'}},
imap_port:()=>{return {type:'imap_port',q:`IMAP port?`,a:143,h:'IMAP=143'}},
dhcp_port:()=>{return {type:'dhcp_port',q:`DHCP server port?`,a:67,h:'DHCP=67(server),68(client)'}},
ntp_port:()=>{return {type:'ntp_port',q:`NTP port?`,a:123,h:'NTP=123'}},
snmp_port:()=>{return {type:'snmp_port',q:`SNMP port?`,a:161,h:'SNMP=161'}},
rdp_port:()=>{return {type:'rdp_port',q:`RDP (Remote Desktop) port?`,a:3389,h:'RDP=3389'}},
vnc_port:()=>{return {type:'vnc_port',q:`VNC default port?`,a:5900,h:'VNC=5900'}},
mysql_port:()=>{return {type:'mysql_port',q:`MySQL default port?`,a:3306,h:'MySQL=3306'}},
postgresql_port:()=>{return {type:'postgresql_port',q:`PostgreSQL default port?`,a:5432,h:'PostgreSQL=5432'}},
cable_cat:()=>{let cat=$p(['Cat5','Cat5e','Cat6','Cat6a','Cat7']),speeds={'Cat5':'100Mbps','Cat5e':'1Gbps','Cat6':'10Gbps(55m)','Cat6a':'10Gbps(100m)','Cat7':'10Gbps+'};return {type:'cable_category',q:`Kabel UTP ${cat}. Max speed?`,a:speeds[cat],h:`${cat}=${speeds[cat]}`}},
fiber_type:()=>{let ft=$p(['Single-mode','Multi-mode']),dist={'Single-mode':'km(analog 100km+)','Multi-mode':'meter(2km max)'};return {type:'fiber_type',q:`Fiber optic ${ft[0]}. Jarak max?`,a:dist[ft[0].split('-')[0]],h:`${ft[0]}=${dist[ft[0].split('-')[0]]}`}},
wifi_standard:()=>{let std=$p(['802.11b','802.11g','802.11n','802.11ac','802.11ax']),speeds={'802.11b':'11Mbps','802.11g':'54Mbps','802.11n':'600Mbps','802.11ac':'1.3Gbps','802.11ax':'9.6Gbps'},freqs={'802.11b':'2.4GHz','802.11g':'2.4GHz','802.11n':'2.4/5GHz','802.11ac':'5GHz','802.11ax':'2.4/5/6GHz'};return {type:'wifi_standard',q:`WiFi ${std}. Max speed?`,a:speeds[std],h:`${std}=${speeds[std]} @${freqs[std]}`}},
wifi_freq:()=>{let std=$p(['802.11b','802.11g','802.11n','802.11ac','802.11ax']),freqs={'802.11b':'2.4GHz','802.11g':'2.4GHz','802.11n':'2.4/5GHz','802.11ac':'5GHz','802.11ax':'2.4/5/6GHz'};return {type:'wifi_frequency',q:`WiFi ${std}. Frekuensi?`,a:freqs[std],h:`${std}=${freqs[std]}`}},
channel_wifi:()=>{return {type:'wifi_channel',q:`WiFi 2.4GHz punya berapa channel non-overlapping?`,a:3,h:'Channel 1,6,11 (non-overlap)'}},
antenna_type:()=>{let ant=$p(['Omni-directional','Directional','Yagi','Parabolic']),uses={'Omni-directional':'area 360°','Directional':'point-to-point','Yagi':'jarak menengah','Parabolic':'jarak jauh'};return {type:'antenna_type',q:`Antena ${ant.split(' ')[0]}. Penggunaan?`,a:uses[ant],h:`${ant}=${uses[ant]}`}},
poe:()=>{return {type:'poe',q:`PoE (Power over Ethernet) standar IEEE?`,a:'802.3af',h:'802.3af(15.4W),802.3at(30W),802.3bt(90W)'}},
poe_watt:()=>{let std=$p(['802.3af','802.3at','802.3bt']),watts={'802.3af':'15.4W','802.3at':'30W','802.3bt':'90W'};return {type:'poe_wattage',q:`PoE ${std}. Max power?`,a:watts[std],h:`${std}=${watts[std]}`}},
vlan:()=>{return {type:'vlan',q:`VLAN berfungsi di layer OSI ke-?`,a:2,h:'VLAN=Layer 2 (Data Link)'}},
trunk:()=>{return {type:'trunk_port',q:`Port trunk pada switch digunakan untuk?`,a:'membawa multiple VLAN',h:'Trunk=multiple VLAN dengan tagging'}},
access_port:()=>{return {type:'access_port',q:`Port access pada switch hanya membawa VLAN?`,a:1,h:'Access port=1 VLAN'}},
stp:()=>{return {type:'stp',q:`STP (Spanning Tree Protocol) mencegah?`,a:'loop',h:'STP mencegah switching loop'}},
router_protocol:()=>{let proto=$p(['RIP','OSPF','EIGRP','BGP']),types={'RIP':'distance vector','OSPF':'link state','EIGRP':'hybrid','BGP':'path vector'};return {type:'routing_protocol',q:`Routing protocol ${proto}. Tipe?`,a:types[proto],h:`${proto}=${types[proto]}`}},
rip_metric:()=>{return {type:'rip_metric',q:`RIP menggunakan metric?`,a:'hop count',h:'RIP metric=hop count(max 15)'}},
ospf_metric:()=>{return {type:'ospf_metric',q:`OSPF menggunakan metric?`,a:'cost(bandwidth)',h:'OSPF metric=cost(based on bandwidth)'}},
static_route:()=>{return {type:'static_routing',q:`Static routing dikonfigurasi oleh?`,a:'admin manually',h:'Static route=manual by admin'}},
default_route:()=>{return {type:'default_route',q:`Default route ditulis sebagai?`,a:'0.0.0.0/0',h:'0.0.0.0/0 = route to anywhere'}},
nat:()=>{return {type:'nat',q:`NAT kepanjangan?`,a:'Network Address Translation',h:'NAT=translate private↔public IP'}},
pat:()=>{return {type:'pat',q:`PAT (Port Address Translation) disebut juga?`,a:'NAT Overload',h:'PAT=NAT Overload (many-to-one)'}},
firewall:()=>{return {type:'firewall',q:`Firewall berfungsi untuk?`,a:'filter traffic',h:'Firewall=security filter(in/out)'}},
dmz:()=>{return {type:'dmz',q:`DMZ kepanjangan?`,a:'Demilitarized Zone',h:'DMZ=public-facing servers zone'}},
proxy:()=>{return {type:'proxy',q:`Proxy server berfungsi?`,a:'perantara client-server',h:'Proxy=intermediary(cache,filter)'}},
load_balancer:()=>{return {type:'load_balancer',q:`Load balancer berfungsi?`,a:'distribusi beban server',h:'Load balancer=distribute traffic'}},
qos:()=>{return {type:'qos',q:`QoS kepanjangan?`,a:'Quality of Service',h:'QoS=prioritize traffic types'}},
bandwidth_mgmt:()=>{let bw=$r(10,100),usr=$r(5,20),guar=$r(30,70),min=_.round(bw*guar/100/usr*10)/10;return {type:'bandwidth_management',q:`Total ${bw}Mbps, ${usr} user, guarantee ${guar}%. Min/user? (1des)`,a:min,h:`(${bw}×${guar}%)÷${usr}=${min}Mbps`}},
monitoring:()=>{return {type:'network_monitoring',q:`Software monitoring jaringan populer?`,a:'PRTG/Nagios/Zabbix',h:'PRTG,Nagios,Zabbix,Cacti'}},
wireshark:()=>{return {type:'wireshark',q:`Wireshark digunakan untuk?`,a:'packet analyzer',h:'Wireshark=capture&analyze packets'}},
nmap:()=>{return {type:'nmap',q:`Nmap digunakan untuk?`,a:'network scanning',h:'Nmap=scan ports,hosts,services'}},
ping_cmd:()=>{return {type:'ping_command',q:`Command ping protokol?`,a:'ICMP',h:'Ping uses ICMP Echo Request/Reply'}},
traceroute:()=>{return {type:'traceroute',q:`Traceroute/tracert menunjukkan?`,a:'path/route taken',h:'Shows hops from source to destination'}},
ipconfig:()=>{return {type:'ipconfig',q:`ipconfig /release berfungsi?`,a:'melepaskan IP DHCP',h:'Release DHCP lease'}},
ipconfig_renew:()=>{return {type:'ipconfig_renew',q:`ipconfig /renew berfungsi?`,a:'memperbarui IP DHCP',h:'Renew DHCP lease'}},
nslookup:()=>{return {type:'nslookup',q:`nslookup digunakan untuk?`,a:'query DNS',h:'Query DNS records'}},
dig:()=>{return {type:'dig_command',q:`dig kepanjangan?`,a:'Domain Information Groper',h:'dig=DNS lookup tool(Linux)'}},
netstat:()=>{return {type:'netstat',q:`netstat menampilkan?`,a:'network connections',h:'Active connections,ports,protocols'}},
ss:()=>{return {type:'ss_command',q:`ss command pengganti?`,a:'netstat',h:'ss=socket statistics(newer netstat)'}},
curl:()=>{return {type:'curl_command',q:`curl digunakan untuk?`,a:'transfer data URL',h:'curl=command-line HTTP client'}},
wget:()=>{return {type:'wget_command',q:`wget digunakan untuk?`,a:'download files',h:'wget=non-interactive downloader'}},
scp:()=>{return {type:'scp_command',q:`SCP protokol dasar?`,a:'SSH',h:'SCP=Secure Copy over SSH'}},
rsync:()=>{return {type:'rsync_command',q:`rsync keunggulan?`,a:'sync incremental',h:'Only transfer changed parts'}},
chmod:()=>{let perm=$p(['755','644','777','600','400']),desc={'755':'rwxr-xr-x','644':'rw-r--r--','777':'rwxrwxrwx','600':'rw-------','400':'r--------'};return {type:'chmod_command',q:`chmod ${perm}. Permission?`,a:desc[perm],h:`${perm}=${desc[perm]}`}},
chown:()=>{return {type:'chown_command',q:`chown berfungsi?`,a:'change owner',h:'Change file/directory ownership'}},
tar:()=>{return {type:'tar_command',q:`tar -czvf membuat archive?`,a:'compressed .tar.gz',h:'c=create,z=gzip,v=verbose,f=file'}},
gzip:()=>{return {type:'gzip_command',q:`gzip file.txt menghasilkan?`,a:'file.txt.gz',h:'Compress to .gz format'}},
backup_strategy:()=>{let bs=$p(['Full','Incremental','Differential']),desc={'Full':'semua data','Incremental':'sejak backup terakhir','Differential':'sejak full backup'};return {type:'backup_strategy',q:`Backup ${bs}. Yang dibackup?`,a:desc[bs],h:`${bs} backup=${desc[bs]}`}},
raid:()=>{let lvl=$p([0,1,5,10]),desc={0:'striping(no redundancy)',1:'mirroring',5:'striping+parity',10:'mirror+stripe'};return {type:'raid_level',q:`RAID ${lvl}. Karakteristik?`,a:desc[lvl],h:`RAID ${lvl}=${desc[lvl]}`}},
ups:()=>{return {type:'ups',q:`UPS kepanjangan?`,a:'Uninterruptible Power Supply',h:'Battery backup for power failure'}},
server_room:()=>{return {type:'server_room',q:`Suhu ideal server room (°C)?`,a:'20-25',h:'20-25°C, humidity 40-60%'}},
cable_mgmt:()=>{return {type:'cable_management',q:`Manajemen kabel rapi penting untuk?`,a:'airflow & troubleshooting',h:'Better cooling,easier maintenance'}},
patch_panel:()=>{return {type:'patch_panel',q:`Patch panel berfungsi?`,a:'terminasi kabel terstruktur',h:'Organized cable termination point'}},
rack_unit:()=>{return {type:'rack_unit',q:`1U (rack unit) = ? inch`,a:1.75,h:'1U=1.75 inch (44.45mm)'}},
kvm:()=>{return {type:'kvm',q:`KVM switch kepanjangan?`,a:'Keyboard Video Mouse',h:'Control multiple computers'}},
console_cable:()=>{return {type:'console_cable',q:`Kabel console router/switch biasanya?`,a:'RJ45-to-DB9/USB',h:'Serial connection for config'}},
putty:()=>{return {type:'putty',q:`PuTTY adalah?`,a:'SSH/Telnet client',h:'Terminal emulator for Windows'}},
terminal:()=>{return {type:'terminal_emulator',q:`Terminal emulator Linux populer?`,a:'GNOME Terminal/Konsole',h:'Terminal access to shell'}},
bash:()=>{return {type:'bash_shell',q:`Bash kepanjangan?`,a:'Bourne Again SHell',h:'Default shell for most Linux'}},
grep:()=>{return {type:'grep_command',q:`grep digunakan untuk?`,a:'search text pattern',h:'Search/filter text with regex'}},
awk:()=>{return {type:'awk_command',q:`awk digunakan untuk?`,a:'text processing',h:'Pattern scanning & processing'}},
sed:()=>{return {type:'sed_command',q:`sed digunakan untuk?`,a:'stream editor',h:'Find/replace text in streams'}},
pipe:()=>{return {type:'pipe_operator',q:`Operator pipe (|) berfungsi?`,a:'output ke input command lain',h:'Pipe stdout→stdin'}},
redirect:()=>{return {type:'redirect_operator',q:`> dalam bash berfungsi?`,a:'redirect output (overwrite)',h:'Redirect stdout to file'}},
cron:()=>{return {type:'cron_job',q:`Cron job berfungsi?`,a:'scheduled tasks',h:'Automated scheduled execution'}},
systemd:()=>{return {type:'systemd',q:`systemctl digunakan untuk?`,a:'manage systemd services',h:'Start/stop/enable services'}},
journalctl:()=>{return {type:'journalctl',q:`journalctl menampilkan?`,a:'system logs',h:'View systemd journal logs'}},
dmesg:()=>{return {type:'dmesg_command',q:`dmesg menampilkan?`,a:'kernel ring buffer',h:'Hardware/boot messages'}},
top_htop:()=>{return {type:'top_htop',q:`top/htop menampilkan?`,a:'processes & resource usage',h:'Real-time system monitoring'}},
ps:()=>{return {type:'ps_command',q:`ps menampilkan?`,a:'running processes',h:'Snapshot of current processes'}},
kill:()=>{return {type:'kill_command',q:`kill -9 berarti?`,a:'force kill (SIGKILL)',h:'Immediately terminate process'}},
df:()=>{return {type:'df_command',q:`df -h menampilkan?`,a:'disk space (human readable)',h:'Disk free space'}},
du:()=>{return {type:'du_command',q:`du -sh * menampilkan?`,a:'ukuran folder (human readable)',h:'Disk usage per directory'}},
free:()=>{return {type:'free_command',q:`free -h menampilkan?`,a:'memory usage (human readable)',h:'RAM & swap usage'}},
uname:()=>{return {type:'uname_command',q:`uname -a menampilkan?`,a:'system information',h:'Kernel version,hostname,arch'}},
hostname:()=>{return {type:'hostname_command',q:`hostnamectl set-hostname berfungsi?`,a:'ubah hostname permanen',h:'Set system hostname'}},
ifconfig_ip:()=>{return {type:'ifconfig_ip',q:`ip addr show pengganti?`,a:'ifconfig',h:'Modern replacement for ifconfig'}},
route:()=>{return {type:'route_command',q:`ip route show menampilkan?`,a:'routing table',h:'Show routing table'}},
iptables:()=>{return {type:'iptables',q:`iptables -L menampilkan?`,a:'firewall rules',h:'List firewall rules'}},
ufw:()=>{return {type:'ufw',q:`ufw enable berfungsi?`,a:'aktifkan firewall',h:'Enable Uncomplicated Firewall'}},
selinux:()=>{return {type:'selinux',q:`SELinux kepanjangan?`,a:'Security-Enhanced Linux',h:'Mandatory access control'}},
apparmor:()=>{return {type:'apparmor',q:`AppArmor adalah?`,a:'security module Linux',h:'Mandatory access control (Ubuntu)'}},
docker:()=>{return {type:'docker',q:`Docker digunakan untuk?`,a:'containerization',h:'Run apps in isolated containers'}},
kubernetes:()=>{return {type:'kubernetes',q:`Kubernetes digunakan untuk?`,a:'orchestration container',h:'Manage containerized apps'}},
git:()=>{return {type:'git',q:`Git adalah?`,a:'version control system',h:'Track code changes'}},
github:()=>{return {type:'github',q:`GitHub adalah?`,a:'Git repository hosting',h:'Cloud-based Git service'}},
ci_cd:()=>{return {type:'ci_cd',q:`CI/CD kepanjangan?`,a:'Continuous Integration/Deployment',h:'Automated build & deploy'}},
ansible:()=>{return {type:'ansible',q:`Ansible digunakan untuk?`,a:'configuration management',h:'Automate IT infrastructure'}},
terraform:()=>{return {type:'terraform',q:`Terraform digunakan untuk?`,a:'infrastructure as code',h:'Provision cloud resources'}},
aws:()=>{return {type:'aws',q:`AWS EC2 adalah?`,a:'virtual server cloud',h:'Elastic Compute Cloud'}},
azure:()=>{return {type:'azure',q:`Azure VM adalah?`,a:'virtual machine cloud',h:'Microsoft Azure Virtual Machine'}},
gcp:()=>{return {type:'gcp',q:`GCP Compute Engine adalah?`,a:'virtual server Google',h:'Google Cloud Platform VM'}},
cdn:()=>{return {type:'cdn',q:`CDN kepanjangan?`,a:'Content Delivery Network',h:'Distributed content caching'}},
lb_algo:()=>{let algo=$p(['Round Robin','Least Connection','IP Hash']),desc={'Round Robin':'bergiliran','Least Connection':'koneksi terb sedikit','IP Hash':'berdasarkan IP client'};return {type:'load_balancing_algorithm',q:`Load balancing ${algo}. Cara kerja?`,a:desc[algo],h:`${algo}=${desc[algo]}`}},
health_check:()=>{return {type:'health_check',q:`Health check pada load balancer berfungsi?`,a:'cek status server',h:'Monitor server availability'}},
ssl_tls:()=>{return {type:'ssl_tls',q:`SSL/TLS证书用于?`,a:'encrypt connection',h:'Secure encrypted communication'}},
https:()=>{return {type:'https',q:`HTTPS = HTTP + ?`,a:'SSL/TLS',h:'HTTP Secure (encrypted)'}},
certificate:()=>{return {type:'ssl_certificate',q:`SSL certificate issued by?`,a:'CA (Certificate Authority)',h:'Trusted third-party issuer'}},
letsencrypt:()=>{return {type:'letsencrypt',q:`Let's Encrypt menyediakan?`,a:'free SSL certificates',h:'Free automated CA'}},
http_status:()=>{let codes=[[200,'OK'],[301,'Moved Permanently'],[403,'Forbidden'],[404,'Not Found'],[500,'Internal Server Error']],c=$p(codes);return {type:'http_status_code',q:`HTTP status ${c[0]} berarti?`,a:c[1],h:`${c[0]}=${c[1]}`}},
rest_api:()=>{return {type:'rest_api',q:`REST API menggunakan method?`,a:'GET,POST,PUT,DELETE',h:'HTTP methods for CRUD'}},
json:()=>{return {type:'json',q:`JSON kepanjangan?`,a:'JavaScript Object Notation',h:'Lightweight data format'}},
xml:()=>{return {type:'xml',q:`XML kepanjangan?`,a:'eXtensible Markup Language',h:'Markup language for data'}},
soap:()=>{return {type:'soap',q:`SOAP kepanjangan?`,a:'Simple Object Access Protocol',h:'Protocol for web services'}},
graphql:()=>{return {type:'graphql',q:`GraphQL vs REST: keunggulan GraphQL?`,a:'flexible queries',h:'Client requests exact data needed'}},
websocket:()=>{return {type:'websocket',q:`WebSocket memungkinkan?`,a:'bidirectional real-time',h:'Full-duplex communication'}},
mqtt:()=>{return {type:'mqtt',q:`MQTT digunakan untuk?`,a:'IoT messaging',h:'Lightweight publish/subscribe'}},
coap:()=>{return {type:'coap',q:`CoAP digunakan untuk?`,a:'IoT constrained devices',h:'HTTP-like for IoT'}},
zigbee:()=>{return {type:'zigbee',q:`ZigBee frekuensi?`,a:'2.4GHz (global)',h:'IEEE 802.15.4 based'}},
bluetooth:()=>{return {type:'bluetooth',q:`Bluetooth Classic vs BLE: BLE artinya?`,a:'Bluetooth Low Energy',h:'Low power variant'}},
nfc:()=>{return {type:'nfc',q:`NFC kepanjangan?`,a:'Near Field Communication',h:'Short-range wireless (<10cm)'}},
rfid:()=>{return {type:'rfid',q:`RFID kepanjangan?`,a:'Radio Frequency Identification',h:'Wireless ID tracking'}},
lorawan:()=>{return {type:'lorawan',q:`LoRaWAN untuk?`,a:'LPWAN IoT',h:'Long Range Wide Area Network'}},
nb_iot:()=>{return {type:'nb_iot',q:`NB-IoT kepanjangan?`,a:'Narrowband IoT',h:'Cellular IoT technology'}},
g5:()=>{return {type:'5g',q:`5G menjanjikan latency?`,a:'<1ms',h:'Ultra-low latency'}},
edge_computing:()=>{return {type:'edge_computing',q:`Edge computing berarti?`,a:'proses data dekat sumber',h:'Compute at network edge'}},
fog_computing:()=>{return {type:'fog_computing',q:`Fog computing berada di?`,a:'antara edge dan cloud',h:'Intermediate layer'}},
cloud_types:()=>{let ct=$p(['Public','Private','Hybrid','Community']),desc={'Public':'milik provider','Private':'organisasi sendiri','Hybrid':'public+private','Community':'beberapa organisasi'};return {type:'cloud_deployment',q:`Cloud ${ct}. Karakteristik?`,a:desc[ct],h:`${ct} cloud=${desc[ct]}`}},
saas:()=>{return {type:'saas',q:`SaaS contoh?`,a:'Google Workspace/Office365',h:'Software as a Service'}},
paas:()=>{return {type:'paas',q:`PaaS contoh?`,a:'Heroku/App Engine',h:'Platform as a Service'}},
iaas:()=>{return {type:'iaas',q:`IaaS contoh?`,a:'AWS EC2/Azure VM',h:'Infrastructure as a Service'}},
serverless:()=>{return {type:'serverless',q:`Serverless computing contoh?`,a:'AWS Lambda',h:'Function as a Service'}},
microservices:()=>{return {type:'microservices',q:`Microservices architecture vs monolith: keunggulan?`,a:'scalability & independence',h:'Independent deployment'}},
devops:()=>{return {type:'devops',q:`DevOpsgabungan?`,a:'Development+Operations',h:'Culture of collaboration'}},
agile:()=>{return {type:'agile',q:`Agile methodology fokus?`,a:'iterative development',h:'Sprints,adaptability'}},
scrum:()=>{return {type:'scrum',q:`Scrum Master berperan?`,a:'facilitator coach',h:'Remove impediments'}},
kanban:()=>{return {type:'kanban',q:`Kanban board visualisasi?`,a:'workflow stages',h:'To Do,In Progress,Done'}},
itil:()=>{return {type:'itil',q:`ITIL kepanjangan?`,a:'Information Technology Infrastructure Library',h:'IT service management framework'}},
cobit:()=>{return {type:'cobit',q:`COBIT fokus?`,a:'IT governance',h:'Control objectives for IT'}},
iso27001:()=>{return {type:'iso27001',q:`ISO 27001 tentang?`,a:'information security management',h:'ISMS standard'}},
pci_dss:()=>{return {type:'pci_dss',q:`PCI DSS untuk?`,a:'payment card security',h:'Credit card data protection'}},
gdpr:()=>{return {type:'gdpr',q:`GDPR regulasi?`,a:'EU data privacy',h:'General Data Protection Regulation'}},
uu_pdp:()=>{return {type:'uu_pdp',q:`UU PDP Indonesia tentang?`,a:'pelindungan data pribadi',h:'Undang-Undang No.27/2022'}}}

// ─── Generate soal ───
function gen(){
let k=$p(Object.keys(G)),p=G[k](),op=mo(p.a)
S.cur={...p,a:p.a,opts:op.options,ck:op.correctKey,createdAt:Date.now(),sid:_.random().toString(36).substring(2,8)};S.t=Date.now();S.log.push(p.type)
return {question:p.q,hint:p.h||'',type:p.type,options:op.options,correctKey:op.correctKey}}

// ─── Verifikasi — GA PAKE RELOAD, langsung reset att ───
function ver(key){
if(!S.cur)return {success:false,message:'Tidak ada soal aktif.',reset:true}
// Cek terlalu cepat (robot check) - min 500ms setelah soal muncul
let elapsed=Date.now()-S.t
if(elapsed<S.min){
// Reset timer agar user bisa coba lagi tanpa reload
S.t=Date.now()-S.min+100 // Beri sedikit buffer
return {success:false,message:'Terlalu cepat! Tunggu sebentar... 🤖',tooFast:true,waitMs:S.min-elapsed}
}
if(!key)return {success:false,message:'Pilih A, B, C, D, atau E!'}
let ok=key.toUpperCase()===S.cur.ck
if(ok){S.ok=true;S.att=0
try{sessionStorage.setItem('tkj_verified','true');sessionStorage.setItem('tkj_verify_time',Date.now().toString());localStorage.setItem('tj_math_done',JSON.stringify({verified:true,time:Date.now()}))}catch(e){}
return {success:true,message:'🎉 Benar! Kamu manusia! Masuk galeri.'}}
else{S.att++
if(S.att>=S.max){S.att=0;return {success:false,message:'3× salah! Coba soal baru.',maxed:true,reset:true}}
return {success:false,message:`✗ Salah! Jawaban: ${S.cur.ck}. Sisa ${S.max-S.att}.`,remaining:S.max-S.att,correctAnswer:S.cur.ck}}}
console.log('%c✅ 3× salah → soal baru, hemat kuota!','color:#22c55e;font-weight:bold')

function rst(){S.cur=null;S.att=0;S.ok=false
try{sessionStorage.removeItem('tkj_verified');sessionStorage.removeItem('tkj_verify_time');localStorage.removeItem('tj_math_done')}catch(e){}}
function cek(){
if(sessionStorage.getItem('tkj_verified')==='true'){let t=sessionStorage.getItem('tkj_verify_time');if(t&&Date.now()-parseInt(t)<30*60*1000)return true}
try{let s=localStorage.getItem('tj_math_done');if(s){let d=JSON.parse(s);if(d.verified&&Date.now()-d.time<24*60*60*1000)return true}}catch(e){}
return S.ok}

// ─── Export — GA PAKE RELOAD ───
window.mathChallenge={generate:gen,verify:ver,reset:rst,isVerified:cek}
window.MC=window.mathChallenge;window.generateProblem=gen;window.verifyAnswer=ver
console.log('🧮 TKJ MCv4.0 —',Object.keys(G).length,'jenis soal Matematika SMA & TKJ — zero reload!')
Object.freeze(G);Object.seal(S)
})()
