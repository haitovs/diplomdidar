"""
Startup guide dialog showing test case instructions in Turkmen.
"""

import os
from .qt import QtCore, QtGui, QtWidgets

GUIDE_TEXT = """
<h1 style="color: #1e6ec8;">Tor Simulýatory — Synag Gollanmasy</h1>

<h2>Nädip başlamaly</h2>
<p><b>File &gt; Open Project</b> basyň — gerekli Case-i saýlaň.<br>
Ýaşyl <b>Play</b> düwmesini basyň — hemme enjamlar işläp başlar.<br>
Kompýutere (PC) iki gezek basyň — konsol açylar.<br>
Konsolda <code>ping</code> buýrugy bilen arabaglanyşygy barlaň.</p>

<h3>Peýdaly buýruklar (VPCS konsoly)</h3>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%;">
<tr style="background: #1e6ec8; color: white;">
  <th>Buýruk</th><th>Näme edýär</th>
</tr>
<tr><td><code>show ip</code></td><td>Häzirki IP-adresi görkez</td></tr>
<tr><td><code>ping 192.168.1.2</code></td><td>Beýleki kompýuter bilen baglanyşygy barla</td></tr>
<tr><td><code>ip 10.0.0.1/24</code></td><td>IP-adresi el bilen belläp goý</td></tr>
</table>

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
<tr style="background: #1e6ec8; color: white;">
  <th>Synag</th><th>Näme barlaýarys</th><th>Netije</th>
</tr>
<tr><td>Case 1</td><td>Kommutator arkaly esasy ping</td><td>PC1 ↔ PC2: işleýär</td></tr>
<tr><td>Case 2</td><td>Podseti izolýasiýasy</td><td>Bir podset: işleýär, dürli: ýok</td></tr>
<tr><td>Case 3</td><td>VLAN izolýasiýasy</td><td>Bir VLAN: işleýär, dürli: ýok</td></tr>
<tr><td>Case 4</td><td>Hab we Kommutator</td><td>Hemmesi işleýär, hab hemme ýere iberýär</td></tr>
<tr><td>Case 5</td><td>Ýyldyz topologiýasy</td><td>6 PC 1 kommutator arkaly habarlaşýar</td></tr>
<tr><td>Case 6</td><td>Birnäçe kommutator</td><td>Hemme PC uplink arkaly habarlaşýar</td></tr>
</table>
"""


class GuideDialog(QtWidgets.QDialog):
    """Startup guide dialog with test case instructions in Turkmen."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Tor Simulýatory — Synag Gollanmasy")
        self.setMinimumSize(750, 600)
        self.resize(850, 700)

        # Set window icon from branding
        branding_logo = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "branding", "logo.png"
        )
        if os.path.exists(branding_logo):
            self.setWindowIcon(QtGui.QIcon(branding_logo))

        layout = QtWidgets.QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        # Scrollable HTML content
        text_browser = QtWidgets.QTextBrowser()
        text_browser.setOpenExternalLinks(True)
        text_browser.setHtml(
            '<div style="font-family: -apple-system, Helvetica, Arial, sans-serif; '
            'font-size: 14px; padding: 20px; line-height: 1.6;">'
            + GUIDE_TEXT +
            '</div>'
        )
        layout.addWidget(text_browser)

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
