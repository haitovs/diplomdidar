"""
Startup guide dialog showing test case instructions in Turkmen.
"""

import os
from .qt import QtCore, QtGui, QtWidgets

GUIDE_TEXT = """
<h1 style="color: #003366;">Tor Simulýatory — Synag Gollanmasy</h1>

<h2>Nädip başlamaly</h2>
<p><b>File &gt; Open Project</b> basyň — gerekli Case-i saýlaň.<br>
Ýaşyl <b>Play</b> düwmesini basyň — hemme enjamlar işläp başlar.<br>
Kompýutere (PC) iki gezek basyň — konsol açylar.<br>
Konsolda <code>ping</code> buýrugy bilen arabaglanyşygy barlaň.</p>

<h3>Peýdaly buýruklar (VPCS konsoly)</h3>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%;">
<tr style="background: #003366; color: white;">
  <th>Buýruk</th><th>Näme edýär</th>
</tr>
<tr><td><code>show</code></td><td>PC-niň IP, MAC, gateway maglumatlaryny görkez</td></tr>
<tr><td><code>show ip</code></td><td>Diňe IP sazlamalaryny görkez</td></tr>
<tr><td><code>ping 192.168.1.2</code></td><td>Beýleki kompýuter bilen baglanyşygy barla</td></tr>
<tr><td><code>ip 10.0.0.1/24</code></td><td>IP-adresi el bilen belläp goý</td></tr>
<tr><td><code>ip 10.0.0.1/24 10.0.0.254</code></td><td>IP + gateway bellemek</td></tr>
<tr><td><code>arp</code></td><td>ARP tablisasyny görkez (öwrenilen MAC-adresler)</td></tr>
<tr><td><code>trace 10.0.0.5</code></td><td>Paketiň geçýän ýolyny görkez</td></tr>
<tr><td><code>clear ip</code></td><td>IP sazlamalaryny arassala</td></tr>
<tr><td><code>save</code></td><td>Häzirki sazlamalary ýatda sakla</td></tr>
<tr><td><code>?</code></td><td>Buýruk kömegini görkez</td></tr>
</table>

<h3>Umumy tehnikalar (ähli Case-ler üçin)</h3>

<p><b>1. Enjama <i>sag basmak</i> menýusy:</b></p>
<ul>
  <li><b>Start / Stop</b> — enjamy aýry işlet ýa-da duruz</li>
  <li><b>Console</b> — konsoly aç (PC üçin)</li>
  <li><b>Configure</b> — sazlamalary üýtget (VLAN, portlar we ş.m.)</li>
  <li><b>Change symbol</b> — enjamyň şekilini üýtget</li>
  <li><b>Change hostname</b> — ady üýtget</li>
</ul>

<p><b>2. Kabel/baglanyşyk üstünde <i>sag basmak</i>:</b></p>
<ul>
  <li><b>Start capture</b> — Wireshark bilen paketleri basyp al</li>
  <li><b>Stop capture</b> — basyp almagy duruz</li>
  <li><b>Delete</b> — kabeli aýyr</li>
</ul>

<p><b>3. Kommutatorda VLAN sazlamak:</b></p>
<ol>
  <li>Kommutatora sag basyň → <b>Configure</b></li>
  <li><b>VLAN</b> goýmasyna geçiň</li>
  <li>Porty saýlaň, <b>Type</b> we <b>VLAN</b> belgilerini üýtgediň:
    <ul>
      <li><b>access</b> — kompýuter üçin (diňe bir VLAN)</li>
      <li><b>dot1q</b> — trunk üçin (hemme VLAN-lar)</li>
      <li><b>qinq</b> — VLAN içinde VLAN (öwrençde ulanylmaýar)</li>
    </ul>
  </li>
  <li><b>Apply</b> → <b>OK</b></li>
</ol>

<p><b>4. Paket basyp almak (Packet capture):</b></p>
<ol>
  <li>Kabele sag basyň → <b>Start capture</b></li>
  <li>Interfeýsi saýlaň (adatça birinjisi) → <b>OK</b></li>
  <li>Wireshark awtomatiki açylar (eger gurnalan bolsa)</li>
  <li>PC-den ping ediň — paketler Wireshark-da görüner</li>
  <li>Kabele ýaşyl nokat peýda bolar (capture aktiw)</li>
  <li>Gutaran soň: sag basyň → <b>Stop capture</b></li>
</ol>

<hr>

<h2>Case 1: Esasy ping synag</h2>
<p><b>Taslamadaky enjamlar:</b> 2 kompýuter (PC1, PC2) + 1 kommutator (Switch)</p>
<p><b>Näme barlaýarys:</b> Bir toruň içindäki iki kompýuteriň kommutator arkaly habarlaşyp bilýändigini.</p>
<p><b>Kommutator näme?</b> Kommutator (switch) — kompýuterleri bir ýerli tora birikdirýän enjam. Ol birikdirilen enjamlaryň adreslerini ýatda saklap, maglumatlary diňe gerekli adresata iberýär.</p>
<p><b>Tor sazlamalary:</b></p>
<ul>
  <li>PC1: <code>192.168.1.1/24</code></li>
  <li>PC2: <code>192.168.1.2/24</code></li>
</ul>
<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case1-Basic-Ping</b> taslamasyny açyň</li>
  <li><b>Play</b> basyň</li>
  <li><b>PC1</b>-e iki gezek basyň — konsol açylar</li>
  <li>Ýazyň: <code>ping 192.168.1.2</code></li>
</ol>
<p><b>Netije:</b> Ping üstünlikli geçýär — iki kompýuter bir podsetde habarlaşyp bilýär.</p>

<hr>

<h2>Case 2: Podseti izolýasiýasy</h2>
<p><b>Taslamadaky enjamlar:</b> 3 kompýuter + 1 kommutator</p>
<p><b>Näme barlaýarys:</b> Dürli podsetlerdäki kompýuterleriň bir kommutator arkaly göni habarlaşyp bilmeýändigini.</p>
<p><b>Podset näme?</b> Podset — bir topardaky IP-adresler. Bir podsetdäki kompýuterler göni habarlaşyp bilýär. Dürli podsetler üçin marşrutizator (router) gerek.</p>
<p><b>Tor sazlamalary:</b></p>
<ul>
  <li>PC1: <code>192.168.1.1/24</code> (A podseti)</li>
  <li>PC2: <code>192.168.1.2/24</code> (A podseti)</li>
  <li>PC3: <code>192.168.2.1/24</code> (B podseti — başga!)</li>
</ul>
<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case2-Subnet-Isolation</b> açyň, <b>Play</b> basyň</li>
  <li>PC1 konsolynda: <code>ping 192.168.1.2</code> → <b>işleýär</b></li>
  <li>PC1 konsolynda: <code>ping 192.168.2.1</code> → <b>işlemeýär</b></li>
</ol>
<p><b>Netije:</b> Bir podset — baglanyşyk bar. Dürli podset — baglanyşyk ýok (marşrutizator ýok).</p>

<hr>

<h2>Case 3: VLAN izolýasiýasy</h2>
<p><b>Taslamadaky enjamlar:</b> 3 kompýuter + VLAN sazlanan 1 kommutator</p>
<p><b>Näme barlaýarys:</b> VLAN-yň bir fiziki kommutatory birnäçe wirtual tora bölýändigini.</p>
<p><b>VLAN näme?</b> VLAN (Virtual LAN) — bir kommutatoryň portlaryny izolirlenip, dürli torlara bölýän tehnologiýa. Dürli VLAN-daky kompýuterler biri-birini görmeýär.</p>
<p><b>Tor sazlamalary:</b></p>
<ul>
  <li>PC1: <code>10.0.10.1/24</code> — VLAN 10</li>
  <li>PC2: <code>10.0.10.2/24</code> — VLAN 10</li>
  <li>PC3: <code>10.0.10.3/24</code> — VLAN 20</li>
</ul>
<p><i>Üns beriň: hemme IP-adresler bir podsetde! Ýöne VLAN baglanyşygy petikleýär.</i></p>

<p><b>VLAN-y nädip sazlamaly (kommutatorda):</b></p>
<ol>
  <li>Kommutatora <b>sag basyň</b> → <b>Configure</b> saýlaň</li>
  <li>Täze penjirede <b>VLAN</b> goýmasyna geçiň</li>
  <li>Her porty saýlap, VLAN belgisini bellemeli:
    <ul>
      <li><code>Ethernet0</code> (PC1) → VLAN <b>10</b>, Type: <b>access</b></li>
      <li><code>Ethernet1</code> (PC2) → VLAN <b>10</b>, Type: <b>access</b></li>
      <li><code>Ethernet2</code> (PC3) → VLAN <b>20</b>, Type: <b>access</b></li>
    </ul>
  </li>
  <li><b>Apply</b> we <b>OK</b> basyň</li>
  <li><i>Bellik: Bu taslamada VLAN eýýäm öňünden sazlanan — göni synaga geçip bilersiňiz.</i></li>
</ol>

<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case3-VLAN-Isolation</b> açyň, <b>Play</b> basyň</li>
  <li>PC1 → PC2: <code>ping 10.0.10.2</code> → <b>işleýär</b> (ikisi-de VLAN 10)</li>
  <li>PC1 → PC3: <code>ping 10.0.10.3</code> → <b>işlemeýär</b> (PC3 VLAN 20-de)</li>
</ol>
<p><b>Netije:</b> VLAN kompýuterleri izolirleýär, hatda IP-adresler bir podsetde bolsa-da.</p>

<hr>

<h2>Case 4: Hab we Kommutator tapawudy</h2>
<p><b>Taslamadaky enjamlar:</b> 4 kompýuter + 1 hab + 1 kommutator</p>
<p><b>Näme barlaýarys:</b> Habyň we kommutatoryň arasyndaky tapawudy.</p>
<p><b>Hab näme?</b> Hab (hub) — maglumatlary bir kompýuterden alyp, HEMME birikdirilen enjamlara iberýän ýönekeý enjam.</p>
<p><b>Kommutator näme tapawutly?</b> Kommutator MAC-adresler boýunça diňe gerekli adresata iberýär — has çalt we howpsuz.</p>
<p><b>Tor sazlamalary:</b></p>
<ul>
  <li>PC1, PC2 — hab arkaly</li>
  <li>PC3, PC4 — kommutator arkaly</li>
  <li>Hemmesi: <code>10.0.0.x/24</code></li>
</ul>

<p><b>Paket basyp almak (packet capture) nädip edilýär:</b></p>
<p>Hab bilen kommutatoryň tapawudyny görmek üçin trafigi basyp almak gerek.</p>
<ol>
  <li>Habyň we PC2-niň arasyndaky <b>kabele sag basyň</b></li>
  <li><b>Start capture</b> saýlaň</li>
  <li>Interfeýsi saýlaň we <b>OK</b> basyň (Wireshark açylar)</li>
  <li>PC1 konsolyndan PC3-e ping ediň: <code>ping 10.0.0.3</code></li>
  <li>Wireshark-da PC2 habyň üstünden geçýän ähli paketleri görýär — hab her zady hemme ýere iberýär!</li>
  <li>Şol synagy kommutatordaky kabelde geçirip görüň: PC4 PC3-iň trafigini <b>görmeýär</b></li>
</ol>

<p><b>Synag:</b> Hemme kompýuterler biri-birini pingläp bilýär. Hab hemme portlara iberýär, kommutator diňe gerekli porta.</p>

<hr>

<h2>Case 5: Ýyldyz topologiýasy</h2>
<p><b>Taslamadaky enjamlar:</b> 6 kompýuter + 1 merkezi kommutator</p>
<p><b>Näme barlaýarys:</b> Ýyldyz topologiýasynyň işleýşini — ýerli torlaryň iň köp ulanylýan shemasy.</p>
<p><b>Ýyldyz topologiýasy näme?</b> Hemme enjamlar bir merkezi kommutatora birikdirilýär. Bir kompýuter öçse, beýlekiler işlemegini dowam edýär.</p>
<p><b>Tor sazlamalary:</b> PC1–PC6: <code>10.0.0.1</code> — <code>10.0.0.6</code> (hemmesi <code>/24</code>)</p>
<p><b>Synag:</b> Her PC beýleki hemme PC-leri pingläp bilýär.</p>

<hr>

<h2>Case 6: Birnäçe kommutator (Multi-Switch)</h2>
<p><b>Taslamadaky enjamlar:</b> 4 kompýuter + 2 kommutator (uplink bilen birleşdirilen)</p>
<p><b>Näme barlaýarys:</b> Kompýuterleriň birnäçe kommutator arkaly habarlaşyp bilýändigini.</p>
<p><b>Uplink näme?</b> Uplink — iki kommutatoryň arasyndaky baglanyşyk. Dürli kommutatorlardaky kompýuterleri bir tora birleşdirýär.</p>
<p><b>Tor sazlamalary:</b></p>
<ul>
  <li>PC1, PC2 — Switch1</li>
  <li>PC3, PC4 — Switch2</li>
  <li>Hemmesi: <code>172.16.0.x/24</code></li>
</ul>
<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case6-Multi-Switch</b> açyň, <b>Play</b> basyň</li>
  <li>PC1 → PC2: <code>ping 172.16.0.2</code> → <b>işleýär</b> (bir kommutator)</li>
  <li>PC1 → PC4: <code>ping 172.16.0.4</code> → <b>işleýär</b> (uplink arkaly)</li>
</ol>
<p><b>Netije:</b> Hemme kompýuterler habarlaşyp bilýär. Uplink iki kommutatoryň toparlaryny birleşdirýär.</p>

<hr>

<h2>Jemleýji tablisa</h2>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%;">
<tr style="background: #003366; color: white;">
  <th>Synag</th><th>Näme barlaýarys</th><th>Netije</th>
</tr>
<tr><td>Case 1</td><td>Kommutator arkaly esasy ping</td><td>PC1 ↔ PC2: işleýär</td></tr>
<tr><td>Case 2</td><td>Podseti izolýasiýasy</td><td>Bir podset: işleýär, dürli: ýok</td></tr>
<tr><td>Case 3</td><td>VLAN izolýasiýasy</td><td>Bir VLAN: işleýär, dürli: ýok</td></tr>
<tr><td>Case 4</td><td>Hab we Kommutator</td><td>Hemmesi işleýär, hab hemme ýere iberýär</td></tr>
<tr><td>Case 5</td><td>Ýyldyz topologiýasy</td><td>6 PC 1 kommutator arkaly habarlaşýar</td></tr>
<tr><td>Case 6</td><td>Birnäçe kommutator</td><td>Hemme PC uplink arkaly habarlaşýar</td></tr>
<tr><td>Case 7</td><td>Halka topologiýasy</td><td>4 kommutator halka görnüşinde birikdirilen</td></tr>
<tr><td>Case 8</td><td>VLAN Trunk</td><td>2 kommutator arasynda trunk baglanyşyk</td></tr>
<tr><td>Case 9</td><td>Agaç topologiýasy</td><td>Ierarhiýa: merkez > bölüm > PC</td></tr>
<tr><td>Case 10</td><td>Broadcast domeni</td><td>Hab zynjyry — hemme enjamlar hemme zady görýär</td></tr>
<tr><td>Case 11</td><td>Tor segmentasiýasy</td><td>Bölümler izolirlenip, bir-birini görmeýär</td></tr>
<tr><td>Case 12</td><td>Doly mesh topologiýasy</td><td>Her kommutator beýlekisine birikdirilen</td></tr>
<tr><td>Case 13</td><td>DHCP awtomatik IP bellemek</td><td>DHCP Server pool-dan 4 PC-ä IP berýär</td></tr>
<tr><td>Case 14</td><td>Cisco kommutator modelleri</td><td>L2 we L3 kommutatorlaryň şekil tapawudy</td></tr>
<tr><td>Case 15</td><td>Serwer fermasy</td><td>Web/File/DNS/DHCP serwerler + 3 müşderi</td></tr>
<tr><td>Case 16</td><td>Goşa kommutator redundansiýasy</td><td>2× Cat2960 + STP bilen redundant baglanyşyk</td></tr>
<tr><td>Case 17</td><td>Köp podsetli DHCP</td><td>2 sany aýry podset, her birinde DHCP</td></tr>
<tr><td>Case 18</td><td>3 gatly korporatiw tor</td><td>Core/Distribution/Access + 8 PC</td></tr>
<tr><td>Case 19</td><td>Mini maglumat merkezi</td><td>Serwer zolagy + müşderi zolagy Cat4500 arkaly</td></tr>
<tr><td>Case 20</td><td>Doly korporatiw tor</td><td>HR/IT/Maliýe + Serwer fermasy + 9 PC</td></tr>
<tr><td>Case 21</td><td>Router şlýuzy</td><td>Merkezi Router + 2 podset + 6 PC</td></tr>
<tr><td>Case 22</td><td>Köp routerli tor</td><td>HQ Router + 3 şaham Router + 6 PC + HQ Serwer</td></tr>
</table>

<hr>

<h2>Case 7: Halka topologiýasy (Ring Topology)</h2>
<p><b>Taslamadaky enjamlar:</b> 4 kompýuter + 4 kommutator (halka görnüşinde birikdirilen)</p>
<p><b>Näme barlaýarys:</b> Halka topologiýasynyň işleýşini — enjamlar tegelekleýin birikdirilýär.</p>
<p><b>Halka topologiýasy näme?</b> Her kommutator iki goňşusy bilen birikdirilýär, halkany (ring) emele getirýär. Maglumatlar halka boýunça geçýär.</p>
<p><b>Tor sazlamalary:</b></p>
<ul>
  <li>PC1: <code>10.1.0.1/24</code> → Switch1</li>
  <li>PC2: <code>10.1.0.2/24</code> → Switch2</li>
  <li>PC3: <code>10.1.0.3/24</code> → Switch3</li>
  <li>PC4: <code>10.1.0.4/24</code> → Switch4</li>
</ul>
<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case7-Ring-Topology</b> açyň, <b>Play</b> basyň</li>
  <li>PC1 konsolynda: <code>ping 10.1.0.3</code> → <b>işleýär</b></li>
  <li>PC2 konsolynda: <code>ping 10.1.0.4</code> → <b>işleýär</b></li>
</ol>
<p><b>Netije:</b> Hemme kompýuterler halka arkaly habarlaşyp bilýär.</p>

<hr>

<h2>Case 8: VLAN Trunk</h2>
<p><b>Taslamadaky enjamlar:</b> 4 kompýuter + 2 kommutator (trunk baglanyşykly)</p>
<p><b>Näme barlaýarys:</b> Trunk portunyň birnäçe VLAN-y iki kommutator arasynda geçirip bilýändigini.</p>
<p><b>Trunk näme?</b> Trunk — bir kabel arkaly birnäçe VLAN-yň maglumatlaryny geçirýän baglanyşyk. Kadrlar (frames) VLAN belgileri bilen iberilýär (802.1Q standardy).</p>
<p><b>Tor sazlamalary:</b></p>
<ul>
  <li>PC1: <code>10.10.0.1/24</code> — VLAN 10, Switch1</li>
  <li>PC2: <code>10.20.0.1/24</code> — VLAN 20, Switch1</li>
  <li>PC3: <code>10.10.0.2/24</code> — VLAN 10, Switch2</li>
  <li>PC4: <code>10.20.0.2/24</code> — VLAN 20, Switch2</li>
</ul>

<p><b>Trunk portuny nädip sazlamaly:</b></p>
<ol>
  <li>Kommutatora <b>sag basyň</b> → <b>Configure</b> → <b>VLAN</b> goýmasy</li>
  <li>Kompýuter birikdirilen portlar üçin:
    <ul>
      <li>Type: <b>access</b></li>
      <li>VLAN: degişli VLAN belgisi (10 ýa-da 20)</li>
    </ul>
  </li>
  <li>Trunk porty üçin (iki kommutatoryň arasyndaky kabel):
    <ul>
      <li>Type: <b>dot1q</b> (802.1Q — VLAN tag bilen ibermek)</li>
      <li>VLAN: <b>1</b> (native VLAN, ýöne ähli VLAN geçer)</li>
    </ul>
  </li>
  <li><b>Apply</b> we <b>OK</b> basyň</li>
  <li><i>Bellik: Bu taslamada trunk eýýäm sazlanan — Switch1 port 7 we Switch2 port 7 <b>dot1q</b> görnüşinde.</i></li>
</ol>

<p><b>Access we Trunk tapawudy:</b></p>
<ul>
  <li><b>Access port</b> — diňe bir VLAN-yň trafigini geçirýär (kompýuter birikmek üçin)</li>
  <li><b>Trunk port (dot1q)</b> — ähli VLAN-laryň trafigini bellik (tag) bilen geçirýär (kommutatorlar arasy)</li>
</ul>

<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case8-VLAN-Trunk</b> açyň, <b>Play</b> basyň</li>
  <li>PC1 → PC3: <code>ping 10.10.0.2</code> → <b>işleýär</b> (ikisi-de VLAN 10, trunk arkaly)</li>
  <li>PC1 → PC2: <code>ping 10.20.0.1</code> → <b>işlemeýär</b> (dürli VLAN)</li>
  <li>PC2 → PC4: <code>ping 10.20.0.2</code> → <b>işleýär</b> (ikisi-de VLAN 20, trunk arkaly)</li>
</ol>
<p><b>Netije:</b> Trunk bir kabel arkaly birnäçe VLAN-y geçirýär. VLAN izolýasiýasy saklanýar.</p>

<hr>

<h2>Case 9: Agaç topologiýasy (Tree / Hierarchical)</h2>
<p><b>Taslamadaky enjamlar:</b> 4 kompýuter + 3 kommutator (3 derejeli ierarhiýa)</p>
<p><b>Näme barlaýarys:</b> Agaç (ierarhik) topologiýasynyň işleýşini — uly torlaryň adaty gurluşy.</p>
<p><b>Agaç topologiýasy näme?</b> Enjamlar derejeler boýunça birikdirilýär: merkezi (core) kommutator → bölüm (distribution) kommutatorlary → kompýuterler. Bu uly korporatiw torlarda köp ulanylýar.</p>
<p><b>Tor sazlamalary:</b></p>
<ul>
  <li>Core-Switch (merkez) → Dist-Switch1, Dist-Switch2</li>
  <li>PC1, PC2: <code>192.168.10.1-2/24</code> → Dist-Switch1</li>
  <li>PC3, PC4: <code>192.168.10.3-4/24</code> → Dist-Switch2</li>
</ul>
<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case9-Tree-Topology</b> açyň, <b>Play</b> basyň</li>
  <li>PC1 → PC2: <code>ping 192.168.10.2</code> → <b>işleýär</b></li>
  <li>PC1 → PC4: <code>ping 192.168.10.4</code> → <b>işleýär</b> (merkez arkaly)</li>
</ol>
<p><b>Netije:</b> Hemme kompýuterler ierarhiýa arkaly habarlaşyp bilýär.</p>

<hr>

<h2>Case 10: Broadcast domeni (Hub Chain)</h2>
<p><b>Taslamadaky enjamlar:</b> 6 kompýuter + 2 hab (zynjyr görnüşinde)</p>
<p><b>Näme barlaýarys:</b> Hablaryň zynjyrda birleşdirilende bir uly broadcast domenini döredýändigini.</p>
<p><b>Broadcast domeni näme?</b> Broadcast domeni — bir enjamyň iberen maglumaty HEMME beýleki enjamlara ýetýän ýer. Hab hemme maglumaty hemme ýere iberýär — şonuň üçin uly torlar üçin ýaramly däl.</p>
<p><b>Tor sazlamalary:</b> PC1–PC6: <code>10.5.0.1</code> — <code>10.5.0.6</code> (hemmesi <code>/24</code>)</p>

<p><b>Broadcast-y görmek üçin paket basyp almak:</b></p>
<ol>
  <li>Başga bir haba birikdirilen <b>kabele sag basyň</b> (meselem, PC5-iň kabeline)</li>
  <li><b>Start capture</b> saýlaň → interfeýsi tassyklaň → Wireshark açylar</li>
  <li>PC1-den PC3-e ping ediň: <code>ping 10.5.0.3</code></li>
  <li>Wireshark-da görersiňiz — PC5-iň kabelinden-de PC1↔PC3 paketleri geçip dur!</li>
  <li>Sebäbi hab zynjyrynda — hemme enjamlar bir broadcast domeninde</li>
</ol>

<p><b>Synag:</b> Hemme PC biri-birini pingläp bilýär. Islendik trafik hemme enjamlara ýetýär.</p>
<p><b>Näme üçin möhüm:</b> Uly torlarda bu nätogry — trafik artýar, howpsuzlyk peselýär. Şonuň üçin hablar ornuna kommutatorlar ulanylýar.</p>

<hr>

<h2>Case 11: Tor segmentasiýasy (Network Segmentation)</h2>
<p><b>Taslamadaky enjamlar:</b> 6 kompýuter + 3 kommutator (3 bölüm)</p>
<p><b>Näme barlaýarys:</b> Dürli bölümleriň aýry podsetler bilen izolirlenýändigini.</p>
<p><b>Segmentasiýa näme?</b> Tor segmentasiýasy — uly tory kiçi böleklere bölmek. Her bölüm (meselem, inžener, satyş, HR) öz podsetinde işleýär. Bu howpsuzlygy ýokarlandyrýar.</p>
<p><b>Tor sazlamalary:</b></p>
<ul>
  <li>Inžener bölümi: <code>10.1.1.1-2/24</code> → SW-Engineering</li>
  <li>Satyş bölümi: <code>10.2.1.1-2/24</code> → SW-Sales</li>
  <li>HR bölümi: <code>10.3.1.1-2/24</code> → SW-HR</li>
</ul>
<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case11-Network-Segmentation</b> açyň, <b>Play</b> basyň</li>
  <li>Eng-PC1 → Eng-PC2: <code>ping 10.1.1.2</code> → <b>işleýär</b> (bir bölüm)</li>
  <li>Eng-PC1 → Sales-PC1: <code>ping 10.2.1.1</code> → <b>işlemeýär</b> (dürli podset)</li>
</ol>
<p><b>Netije:</b> Bir bölümiň içinde baglanyşyk bar. Bölümler arasyndaky baglanyşyk petiklenen — howpsuzlyk üpjün edilýär.</p>

<hr>

<h2>Case 12: Doly mesh topologiýasy (Full Mesh)</h2>
<p><b>Taslamadaky enjamlar:</b> 4 kompýuter + 4 kommutator (her biri beýleki 3-e birikdirilen)</p>
<p><b>Näme barlaýarys:</b> Doly mesh topologiýasynyň artykmaçlygyny — her noduň beýleki hemme nodlara göni baglanyşygy bar.</p>
<p><b>Full Mesh näme?</b> Full mesh-de her kommutator beýleki hemme kommutatorlara birikdirilen. Bu iň ygtybarly topologiýa — bir baglanyşyk üzülse, beýleki ýollar arkaly maglumat geçýär.</p>
<p><b>Tor sazlamalary:</b> PC1–PC4: <code>172.20.0.1</code> — <code>172.20.0.4</code> (hemmesi <code>/24</code>)</p>
<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case12-Full-Mesh</b> açyň, <b>Play</b> basyň</li>
  <li>PC1 → PC3: <code>ping 172.20.0.3</code> → <b>işleýär</b></li>
  <li>PC2 → PC4: <code>ping 172.20.0.4</code> → <b>işleýär</b></li>
</ol>
<p><b>Netije:</b> Hemme kompýuterler habarlaşyp bilýär. Birnäçe ýol = ýokary ygtybarlylyk.</p>

<hr>

<h2>Case 13: DHCP Awtomatik IP Bellemek (DHCP Auto-Assignment)</h2>
<p><b>Taslamadaky enjamlar:</b> 1 DHCP Serwer + 4 PC + Cisco 2960 kommutator</p>
<p><b>Näme barlaýarys:</b> DHCP serweriň PC-lere awtomatik IP-adres berýändigini.</p>
<p><b>DHCP näme?</b> DHCP (Dynamic Host Configuration Protocol) — kompýuterlere awtomatik IP-adres, gateway we DNS berýän hyzmat. Her kompýuter tora birikende serwere sorag ugradýar, serwer bolsa pool-dan IP berýär.</p>
<p><b>Tor sazlamalary:</b></p>
<ul>
  <li>DHCP-Server: <code>192.168.1.1/24</code> — serwisin esasy IP-si</li>
  <li>PC1–PC4: Pool-dan <code>192.168.1.100–103/24</code> awtomatik bellenildi</li>
  <li>Kommutator: Cisco Catalyst 2960 (L2), DHCP pool: <code>.100–.200</code></li>
</ul>
<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case13-DHCP-Auto-Assignment</b> açyň, <b>Play</b> basyň</li>
  <li>PC1 konsolynda: <code>show</code> — IP-si <code>192.168.1.100</code> bolmaly</li>
  <li>PC1-den DHCP-Serwere ping: <code>ping 192.168.1.1</code> → <b>işleýär</b></li>
  <li>PC1-den PC4-e: <code>ping 192.168.1.103</code> → <b>işleýär</b></li>
</ol>
<p><b>Netije:</b> DHCP-Server el bilen sazlamak zerurlygyny aradan aýyrýar — PC-ler awtomatik IP alýar.</p>

<hr>

<h2>Case 14: Cisco Kommutator Modelleri (L2 we L3)</h2>
<p><b>Taslamadaky enjamlar:</b> 1× Cat6500 (L3) + 2× Cat3750/3560 (L3) + 2× Cat2960 (L2) + 4 PC</p>
<p><b>Näme barlaýarys:</b> L2 we L3 Cisco kommutatorlarynyň şekil tapawudyny we ierarhiýasyny.</p>
<p><b>L2 we L3 tapawudy:</b></p>
<ul>
  <li><b>L2 kommutator (Cat2960)</b> — MAC-adres boýunça iberýär, diňe bir podset içinde işleýär. Şekli: adaty kommutator ikony.</li>
  <li><b>L3 kommutator (Cat3750, Cat3560, Cat4500, Cat6500)</b> — IP-adres boýunça hem iberip bilýär (routing). Şekli: köp gatly kommutator ikony.</li>
</ul>
<p><b>Tor sazlamalary:</b></p>
<ul>
  <li>Core-Cat6500 (L3) → 2 sany Distribution kommutatory</li>
  <li>Dist-Cat3750 → Access-Cat2960-A → PC1 (<code>10.14.1.1/24</code>), PC2 (<code>10.14.1.2/24</code>)</li>
  <li>Dist-Cat3560 → Access-Cat2960-B → PC3 (<code>10.14.2.1/24</code>), PC4 (<code>10.14.2.2/24</code>)</li>
</ul>
<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case14-Cisco-Switch-Models</b> açyň — L3 kommutatoryň başga şekilini görüň</li>
  <li><b>Play</b> basyň</li>
  <li>PC1 → PC2: <code>ping 10.14.1.2</code> → <b>işleýär</b> (bir Access kommutatory)</li>
  <li>PC1 → PC3: <code>ping 10.14.2.1</code> → <b>işleýär</b> (Distribution + Core arkaly)</li>
</ol>
<p><b>Netije:</b> L3 kommutatorlar "köp gatly" (multilayer) şekilinde görünýär. Ierarhiýa: Core > Distribution > Access > PC.</p>

<hr>

<h2>Case 15: Serwer Fermasy (Server Farm)</h2>
<p><b>Taslamadaky enjamlar:</b> 4 Serwer (Web/File/DNS/DHCP) + 3 müşderi PC + Cisco 3750</p>
<p><b>Näme barlaýarys:</b> Bölünişdirilen serwerleriň birleşip hyzmat edip bilýändigini.</p>
<p><b>Serwer fermasy näme?</b> Serwer fermasy — birnäçe hünärleşdirilen serwerleriň bir kommutatora birikdirilmegi. Her serwer öz hyzmatyny berýär: web sahypalary, faýllar, DNS, DHCP.</p>
<p><b>Tor sazlamalary:</b></p>
<ul>
  <li>Web-Server: <code>10.15.0.10/24</code></li>
  <li>File-Server: <code>10.15.0.11/24</code></li>
  <li>DNS-Server: <code>10.15.0.12/24</code></li>
  <li>DHCP-Server: <code>10.15.0.13/24</code></li>
  <li>Client1–3: <code>10.15.1.1–3/24</code> (başga podset)</li>
  <li>Farm-Cat3750 (L3): hemme enjamlary birleşdirýär</li>
</ul>
<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case15-Server-Farm</b> açyň, <b>Play</b> basyň</li>
  <li>Client1 konsolynda: <code>ping 10.15.0.10</code> → Web-Server bilen baglanyşyk</li>
  <li>Client1 konsolynda: <code>ping 10.15.0.12</code> → DNS-Server bilen baglanyşyk</li>
  <li>Serwerden müşderä: Web-Server konsolyndan <code>ping 10.15.1.1</code></li>
</ol>
<p><b>Netije:</b> Müşderiler Cat3750 (L3) arkaly ähli serwerlere ýetip bilýär, hatda dürli podsetde bolsa-da.</p>

<hr>

<h2>Case 16: Goşa Kommutator Redundansiýasy (Dual-Switch Redundancy)</h2>
<p><b>Taslamadaky enjamlar:</b> 2× Cat2960 + 4 PC + 1 Core Serwer + inter-switch baglanyşyk</p>
<p><b>Näme barlaýarys:</b> Iki kommutatoryň birbirini ätiýaçlaýandygyny — biri öçse beýlekisi işlemegini dowam edýär.</p>
<p><b>Redundansiýa näme?</b> Redundansiýa — bir enjam öçse, işi başga enjamyň alyp gitmegi. Iki kommutator arasyndaky "cross-link" ikinji ýol döredýär. STP (Spanning Tree Protocol) tegelek ýoly bloklap, gerek wagty açýar.</p>
<p><b>Tor sazlamalary:</b></p>
<ul>
  <li>Primary-2960 → PC1 (<code>192.168.16.1</code>), PC2 (<code>192.168.16.2</code>)</li>
  <li>Secondary-2960 → PC3 (<code>192.168.16.3</code>), PC4 (<code>192.168.16.4</code>)</li>
  <li>Core-Server: <code>192.168.16.254/24</code> → Primary-2960</li>
  <li>Inter-switch link: Primary port 23 ↔ Secondary port 23</li>
</ul>
<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case16-Dual-Switch-Redundancy</b> açyň, <b>Play</b> basyň</li>
  <li>PC1 → PC4: <code>ping 192.168.16.4</code> → <b>işleýär</b> (inter-switch link arkaly)</li>
  <li>PC1 → Core-Server: <code>ping 192.168.16.254</code> → <b>işleýär</b></li>
</ol>
<p><b>Netije:</b> Iki kommutator birikdirilen — PC-ler dürli kommutatorda bolsa-da habarlaşyp bilýär. Redundansiýa ýokary elýeterliligi üpjün edýär.</p>

<hr>

<h2>Case 17: Köp Podsetli DHCP (Multi-Subnet DHCP)</h2>
<p><b>Taslamadaky enjamlar:</b> L3 Core Cat3750 + 2× Cat2960 + 2 DHCP Serwer + 4 PC</p>
<p><b>Näme barlaýarys:</b> Iki aýry podsetiň, her birinde öz DHCP-si bilen, L3 kommutator arkaly arabaglanyşyp bilýändigini.</p>
<p><b>Inter-VLAN routing näme?</b> L3 kommutator dürli podsetler arasyndaky trafigi ugradyp bilýär — marşrutizatoryň wezipesini ýerine ýetirýär.</p>
<p><b>Tor sazlamalary:</b></p>
<ul>
  <li>SW-SubnetA (Cat2960) + DHCP-A: Podset <code>192.168.1.0/24</code>, pool: <code>.100–.150</code></li>
  <li>SW-SubnetB (Cat2960) + DHCP-B: Podset <code>192.168.2.0/24</code>, pool: <code>.100–.150</code></li>
  <li>PC-A1: <code>192.168.1.100</code>, PC-A2: <code>192.168.1.101</code></li>
  <li>PC-B1: <code>192.168.2.100</code>, PC-B2: <code>192.168.2.101</code></li>
  <li>Core-Cat3750 (L3): iki podseti birleşdirýär</li>
</ul>
<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case17-Multi-Subnet-DHCP</b> açyň, <b>Play</b> basyň</li>
  <li>PC-A1 → PC-A2: <code>ping 192.168.1.101</code> → <b>işleýär</b> (bir podset)</li>
  <li>PC-A1 → PC-B1: <code>ping 192.168.2.100</code> → <b>işleýär</b> (L3 routing bilen)</li>
  <li>DHCP-A konsolynda: <code>show</code> — öz IP-sini görüň</li>
</ol>
<p><b>Netije:</b> Her podset öz DHCP-sinden IP alýar. L3 Core kommutator podsetler arasyndaky routing üpjün edýär.</p>

<hr>

<h2>Case 18: 3 Gatly Korporatiw Tor (3-Tier Enterprise)</h2>
<p><b>Taslamadaky enjamlar:</b> Cat6500 (Core) + 2× Cat3750 (Distribution) + 4× Cat2960 (Access) + 8 PC + Core Serwer</p>
<p><b>Näme barlaýarys:</b> Uly korporatiw toruň 3 gatlak (tier) arhitekturasyny.</p>
<p><b>3 Gatlak arhitekturasy:</b></p>
<ul>
  <li><b>Core Layer (merkez):</b> Cat6500 — ähli tory birleşdirýär, ýokary tizlikde ibermek</li>
  <li><b>Distribution Layer (bölüm):</b> Cat3750 × 2 — bölüm derejeli routing we aggregation</li>
  <li><b>Access Layer (giriş):</b> Cat2960 × 4 — ulanyjylary tora birleşdirýär</li>
</ul>
<p><b>Tor sazlamalary:</b></p>
<ul>
  <li>Core-Server: <code>10.18.0.1/24</code></li>
  <li>PC1–PC2: <code>10.18.1.x/24</code> (Acc1), PC3–PC4: <code>10.18.2.x/24</code> (Acc2)</li>
  <li>PC5–PC6: <code>10.18.3.x/24</code> (Acc3), PC7–PC8: <code>10.18.4.x/24</code> (Acc4)</li>
</ul>
<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case18-3Tier-Enterprise</b> açyň, <b>Play</b> basyň</li>
  <li>PC1 → PC8: <code>ping 10.18.4.2</code> → <b>işleýär</b> (5 hop: Acc1→Dist1→Core→Dist2→Acc4)</li>
  <li>PC1 → Core-Server: <code>ping 10.18.0.1</code> → <b>işleýär</b></li>
  <li>Yzarlamak üçin: <code>trace 10.18.4.2</code> — her geçilen nokady görüň</li>
</ol>
<p><b>Netije:</b> Korporatiw toruň klassiki 3-gatlak gurluşy: çeýe, giňeldilip bilýän we dolandyrylýan arhitektura.</p>

<hr>

<h2>Case 19: Mini Maglumat Merkezi (Mini Data Center)</h2>
<p><b>Taslamadaky enjamlar:</b> Cat4500 (Aggregation) + Server-Zone-2960 + Client-Zone-2960 + 4 Serwer + 4 Müşderi PC</p>
<p><b>Näme barlaýarys:</b> Serwer zolagy bilen müşderi zolagyny Cat4500 arkaly birleşdirmegi.</p>
<p><b>Maglumat merkezi arhitekturasy:</b> Serwer zolagynyň müşderi zolагyndan aýry saklanmagy howpsuzlygy we dolandyrmagy aňsatlaşdyrýar. Aggregation kommutatory iki zolagy birleşdirip routing edýär.</p>
<p><b>Tor sazlamalary:</b></p>
<ul>
  <li>Serwer zolagy (Server-Zone-2960): Web-Server-1/2 (<code>10.19.1.10-11</code>), File-Server (<code>10.19.1.12</code>), Mail-Server (<code>10.19.1.13</code>)</li>
  <li>Müşderi zolagy (Client-Zone-2960, DHCP): Client1–4 (<code>10.19.2.100–103</code>)</li>
  <li>Aggregation-Cat4500 (L3): iki zolagy birleşdirýär</li>
</ul>
<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case19-Mini-Data-Center</b> açyň, <b>Play</b> basyň</li>
  <li>Client1 → Web-Server-1: <code>ping 10.19.1.10</code> → <b>işleýär</b></li>
  <li>Client1 → Mail-Server: <code>ping 10.19.1.13</code> → <b>işleýär</b></li>
  <li>Web-Server-1 → Web-Server-2: <code>ping 10.19.1.11</code> → <b>işleýär</b> (serwer içi)</li>
</ol>
<p><b>Netije:</b> Müşderiler Cat4500 aggregation arkaly serwerler bilen habarlaşýar. Iki zolak logiki taýdan bölünen, fiziki taýdan birleşen.</p>

<hr>

<h2>Case 20: Doly Korporatiw Tor (Full Enterprise Network)</h2>
<p><b>Taslamadaky enjamlar:</b> Core Cat6500 + Server Farm (Cat3560 + 4 Serwer) + HR/IT/Maliýe (her biri Cat3750 + Cat2960 + 3 PC)</p>
<p><b>Näme barlaýarys:</b> Hakyky korporasiýanyň doly tor gurluşyny — bölümler, serwerler, we routing.</p>
<p><b>Tor gurluşy:</b></p>
<ul>
  <li><b>Core:</b> Cat6500 — ähli bölümleriň we serwer fermasyny birleşdirýär</li>
  <li><b>Serwer fermasy:</b> Cat3560 (L3) + Web (<code>10.20.0.10</code>), File (<code>10.20.0.11</code>), DNS (<code>10.20.0.12</code>), Mail (<code>10.20.0.13</code>)</li>
  <li><b>HR bölümi:</b> Dist-HR-3750 + Access-HR-2960 + HR-PC1/2/3 (<code>10.20.1.50–52</code>)</li>
  <li><b>IT bölümi:</b> Dist-IT-3750 + Access-IT-2960 + IT-PC1/2/3 (<code>10.20.2.50–52</code>)</li>
  <li><b>Maliýe bölümi:</b> Dist-Finance-3750 + Access-Fin-2960 + Fin-PC1/2/3 (<code>10.20.3.50–52</code>)</li>
</ul>
<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case20-Enterprise-Network</b> açyň, <b>Play</b> basyň</li>
  <li>HR-PC1 → IT-PC1: <code>ping 10.20.2.50</code> → <b>işleýär</b> (bölümler arasy L3 routing)</li>
  <li>Fin-PC1 → Web-Server: <code>ping 10.20.0.10</code> → <b>işleýär</b> (serwer fermasyna giriş)</li>
  <li>HR-PC1 → Fin-PC3: <code>ping 10.20.3.52</code> → <b>işleýär</b> (Core arkaly)</li>
  <li>IT-PC2 konsolynda: <code>trace 10.20.0.11</code> — serwere barýan ýoly görüň</li>
</ol>
<p><b>Netije:</b> Doly korporatiw tor — her bölüm öz podsetinde işleýär, Core Cat6500 ähli bölümleri we serwer fermasyny birleşdirýär. Bu hakyky iş gurşawyny simuleýär.</p>

<h2>Case 21: Router Şlýuzy (Router as Gateway)</h2>
<p><b>Taslamadaky enjamlar:</b> 1 Router + 2 kommutator + 6 PC</p>
<p><b>Näme barlaýarys:</b> Routeriň iki aýry podset arasynda şlýuz hökmünde işleýşini.</p>
<p><b>Tor gurluşy:</b></p>
<ul>
  <li><b>GW-Router:</b> <code>192.168.1.1/24</code> — iki podseti birleşdirýär</li>
  <li><b>Podset A (Switch-A):</b> PC-A1/A2/A3 — <code>192.168.1.10–12</code>, şlýuz <code>192.168.1.1</code></li>
  <li><b>Podset B (Switch-B):</b> PC-B1/B2/B3 — <code>192.168.2.10–12</code>, şlýuz <code>192.168.2.1</code></li>
</ul>
<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case21-Router-Gateway</b> açyň, <b>Play</b> basyň</li>
  <li>PC-A1 → PC-A2: <code>ping 192.168.1.11</code> → <b>işleýär</b> (bir podsetde)</li>
  <li>PC-A1 → GW-Router: <code>ping 192.168.1.1</code> → <b>işleýär</b> (şlýuza ping)</li>
  <li>GW-Router we Switch-B arasyna el bilen kabel goşuň → PC-A1 → PC-B1 ping synanyň</li>
</ol>
<p><b>Netije:</b> Router enjamy tor diagrammada görkezilýär. Routerler aýry podsetleri birleşdirýär — bu routing düşünjesini öwretmek üçin esasy mysaldyr.</p>

<h2>Case 22: Köp Routerli Tor (Multi-Router Network)</h2>
<p><b>Taslamadaky enjamlar:</b> HQ Router + 3 şaham Router + 3 kommutator + HQ Serwer + 6 PC</p>
<p><b>Näme barlaýarys:</b> Merkezi HQ we 3 şaham ofisini birleşdirýän köp routerli tory.</p>
<p><b>Tor gurluşy:</b></p>
<ul>
  <li><b>HQ-Router:</b> <code>10.0.0.1/8</code> — merkezi ýol, HQ Serweri bar</li>
  <li><b>Branch1-R:</b> <code>10.1.0.1/24</code> — B1-PC1/B1-PC2 (<code>10.1.0.10–11</code>)</li>
  <li><b>Branch2-R:</b> <code>10.2.0.1/24</code> — B2-PC1/B2-PC2 (<code>10.2.0.10–11</code>)</li>
  <li><b>Branch3-R:</b> <code>10.3.0.1/24</code> — B3-PC1/B3-PC2 (<code>10.3.0.10–11</code>)</li>
  <li><b>HQ-Server:</b> <code>10.0.0.10/8</code> — merkezi serwer</li>
</ul>
<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case22-Multi-Router</b> açyň, <b>Play</b> basyň</li>
  <li>B1-PC1 → HQ-Server: <code>ping 10.0.0.10</code> → <b>işleýär</b> (branch → HQ)</li>
  <li>B2-PC1 → Branch2 Router: <code>ping 10.2.0.1</code> → <b>işleýär</b> (lokal şlýuz)</li>
  <li>Tor diagrammasynda router ikonlaryna serediň — VPCS, Serwer we Routerden tapawudy görüň</li>
</ol>
<p><b>Netije:</b> Köp routerli tor gurluşy — her şaham öz routerinde işleýär, HQ routeri ähli şahamlary birleşdirýär. Hakyky WAN/branch gurluşyny görkezýär.</p>
"""


class GuideDialog(QtWidgets.QDialog):
    """Startup guide dialog with test case instructions in Turkmen."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Tor Simulýatory — Synag Gollanmasy")
        self.setMinimumSize(950, 650)
        self.resize(1080, 750)

        # Set window icon from branding
        branding_logo = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "branding", "logo.png"
        )
        if os.path.exists(branding_logo):
            self.setWindowIcon(QtGui.QIcon(branding_logo))

        layout = QtWidgets.QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        # Main content area: text on left, logo on right
        content_splitter = QtWidgets.QHBoxLayout()
        content_splitter.setContentsMargins(0, 0, 0, 0)
        content_splitter.setSpacing(0)

        # Scrollable HTML content
        text_browser = QtWidgets.QTextBrowser()
        text_browser.setOpenExternalLinks(True)
        text_browser.setHtml(
            '<div style="font-family: -apple-system, Helvetica, Arial, sans-serif; '
            'font-size: 14px; padding: 20px; line-height: 1.6;">'
            + GUIDE_TEXT +
            '</div>'
        )
        content_splitter.addWidget(text_browser, stretch=3)

        # Right-side logo panel
        logo_panel = QtWidgets.QWidget()
        logo_panel.setFixedWidth(220)
        logo_panel.setStyleSheet(
            "QWidget { background: qlineargradient(x1:0, y1:0, x2:0, y2:1, "
            "stop:0 #003366, stop:1 #001a33); }"
        )
        logo_layout = QtWidgets.QVBoxLayout(logo_panel)
        logo_layout.setContentsMargins(15, 30, 15, 30)
        logo_layout.setAlignment(QtCore.Qt.AlignmentFlag.AlignCenter)

        # Logo image
        logo_img = QtWidgets.QLabel()
        if os.path.exists(branding_logo):
            pixmap = QtGui.QPixmap(branding_logo).scaled(
                160, 160,
                QtCore.Qt.AspectRatioMode.KeepAspectRatio,
                QtCore.Qt.TransformationMode.SmoothTransformation
            )
            logo_img.setPixmap(pixmap)
        logo_img.setAlignment(QtCore.Qt.AlignmentFlag.AlignCenter)
        logo_img.setStyleSheet(
            "QLabel { background: #ffffff; border: 3px solid #ffffff; "
            "border-radius: 85px; padding: 8px; }"
        )
        logo_img.setFixedSize(170, 170)
        logo_layout.addWidget(logo_img, alignment=QtCore.Qt.AlignmentFlag.AlignCenter)

        logo_layout.addSpacing(15)

        # University name text
        uni_label = QtWidgets.QLabel("Oguz Han\nadyndaky\nInžener-tehnologiýalar\nuniversiteti")
        uni_label.setAlignment(QtCore.Qt.AlignmentFlag.AlignCenter)
        uni_label.setWordWrap(True)
        uni_label.setStyleSheet(
            "QLabel { color: #ffffff; font-size: 13px; font-weight: bold; "
            "background: transparent; border: none; }"
        )
        logo_layout.addWidget(uni_label)

        logo_layout.addSpacing(10)

        # Subtitle
        sub_label = QtWidgets.QLabel("Tor Simulýatory")
        sub_label.setAlignment(QtCore.Qt.AlignmentFlag.AlignCenter)
        sub_label.setStyleSheet(
            "QLabel { color: #88bbee; font-size: 12px; font-style: italic; "
            "background: transparent; border: none; }"
        )
        logo_layout.addWidget(sub_label)

        logo_layout.addStretch()

        content_splitter.addWidget(logo_panel)

        content_widget = QtWidgets.QWidget()
        content_widget.setLayout(content_splitter)
        layout.addWidget(content_widget)

        # Bottom bar with checkbox + close button
        bottom = QtWidgets.QHBoxLayout()
        self._showOnStartup = QtWidgets.QCheckBox("Başlanda görkez / Show on startup")
        self._showOnStartup.setChecked(True)
        bottom.addWidget(self._showOnStartup)
        bottom.addStretch()

        close_btn = QtWidgets.QPushButton("Ýapmak / Close")
        close_btn.setFixedWidth(160)
        close_btn.clicked.connect(self.accept)
        bottom.addWidget(close_btn)

        bottom_widget = QtWidgets.QWidget()
        bottom_widget.setLayout(bottom)
        bottom_widget.setContentsMargins(10, 5, 10, 10)
        layout.addWidget(bottom_widget)

    def showOnStartup(self):
        return self._showOnStartup.isChecked()


# Settings file for show-on-startup preference
_GUIDE_SETTINGS = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "branding", "guide_setting.txt"
)


def should_show_guide():
    try:
        with open(_GUIDE_SETTINGS, "r") as f:
            return f.read().strip() != "hide"
    except FileNotFoundError:
        return True


def save_guide_preference(show):
    try:
        with open(_GUIDE_SETTINGS, "w") as f:
            f.write("show" if show else "hide")
    except Exception:
        pass
