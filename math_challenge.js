/**
 * TKJ OnE — Math Challenge v3.1
 * 65 jenis soal. A/B/C/D/E. Zero page reload. Hemat kuota.
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
const S={cur:null,att:0,max:3,ok:false,t:0,min:1200,log:[]}

// ─── Generate opsi A/B/C/D/E dari jawaban benar ───
function mo(c){
let pool=[c],mag=_.abs(c)
let step=mag<1?.1:mag<10?1:mag<100?5:mag<1000?50:mag<10000?500:mag<100000?5000:mag<1e6?50000:100000
for(let m of[-3,-2,-1,1,2,3,4,5]){let v=parseFloat((c+m*step).toFixed(step<1?1:0));if(v>0)pool.push(v)}
let u=[...new Set(pool)].slice(0,5);while(u.length<5)u.push(_.abs(c)+u.length*step||1)
for(let i=u.length-1;i>0;i--){let j=$r(0,i);[u[i],u[j]]=[u[j],u[i]]}
let o=u.map(v=>({value:v,text:v%1===0?String(v).replace(/\B(?=(\d{3})+(?!\d))/g,'.'):v.toFixed(1)})),ck=''
o.forEach((x,i)=>{x.key=String.fromCharCode(65+i);if(_.abs(x.value-c)<0.01)ck=x.key})
return {options:o,correctKey:ck}}

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
suhu:()=>{let c=$r(10,100),f=_.round(c*9/5+32);return {type:'konversi_suhu',q:`${c}°C ke °F? (Rumus: °C×9/5+32)`,a:f,h:`${c}×9/5+32 = ${f}°F`}}}

// ─── Generate soal ───
function gen(){
let k=$p(Object.keys(G)),p=G[k](),op=mo(p.a)
S.cur={...p,a:p.a,opts:op.options,ck:op.correctKey,createdAt:Date.now(),sid:_.random().toString(36).substring(2,8)}
S.t=Date.now();S.log.push(p.type)
return {question:p.q,hint:p.h||'',type:p.type,options:op.options,correctKey:op.correctKey}}

// ─── Verifikasi — GA PAKE RELOAD, langsung reset att ───
function ver(key){
if(!S.cur)return {success:false,message:'Tidak ada soal aktif.',reset:true}
if(Date.now()-S.t<S.min)return {success:false,message:'Terlalu cepat! Kamu robot? 😏',tooFast:true}
if(!key)return {success:false,message:'Pilih A, B, C, D, atau E!'}
let ok=key.toUpperCase()===S.cur.ck
if(ok){S.ok=true;S.att=0
try{sessionStorage.setItem('tkj_verified','true');sessionStorage.setItem('tkj_verify_time',Date.now().toString());localStorage.setItem('tj_math_done',JSON.stringify({verified:true,time:Date.now()}))}catch(e){}
return {success:true,message:'🎉 Benar! Kamu manusia! Masuk galeri.'}}
else{S.att++
if(S.att>=S.max){S.att=0;return {success:false,message:'3× salah! Coba soal baru.',maxed:true,reset:true}}
return {success:false,message:`✗ Salah! Jawaban: ${S.cur.ck}. Sisa ${S.max-S.att}.`,remaining:S.max-S.att,correctAnswer:S.cur.ck}}}

function rst(){S.cur=null;S.att=0;S.ok=false
try{sessionStorage.removeItem('tkj_verified');sessionStorage.removeItem('tkj_verify_time');localStorage.removeItem('tj_math_done')}catch(e){}}
function cek(){
if(sessionStorage.getItem('tkj_verified')==='true'){let t=sessionStorage.getItem('tkj_verify_time');if(t&&Date.now()-parseInt(t)<30*60*1000)return true}
try{let s=localStorage.getItem('tj_math_done');if(s){let d=JSON.parse(s);if(d.verified&&Date.now()-d.time<24*60*60*1000)return true}}catch(e){}
return S.ok}

// ─── Export — GA PAKE RELOAD ───
window.mathChallenge={generate:gen,verify:ver,reset:rst,isVerified:cek}
window.MC=window.mathChallenge;window.generateProblem=gen;window.verifyAnswer=ver
console.log('🧮 TKJ MCv3.1 —',Object.keys(G).length,'soal A/B/C/D/E — zero reload!')
console.log('%c✅ 3× salah → soal baru, hemat kuota!','color:#22c55e;font-weight:bold')
Object.freeze(G);Object.seal(S)
})()
