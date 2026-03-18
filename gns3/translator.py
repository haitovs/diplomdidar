"""
Turkmen/English translation module for Network Simulator.
Provides a simple toggle between English and Turkmen UI.
"""

import os
import json

from gns3.qt import QtCore

TRANSLATIONS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "branding", "translations.json")
LANG_SETTINGS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "branding", "lang_setting.txt")


def _load_translations():
    try:
        with open(TRANSLATIONS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


_translations = _load_translations()
_current_lang = "en"


def current_language():
    return _current_lang


def set_language(lang):
    global _current_lang
    _current_lang = lang
    try:
        with open(LANG_SETTINGS_FILE, "w") as f:
            f.write(lang)
    except Exception:
        pass


def load_saved_language():
    global _current_lang
    try:
        with open(LANG_SETTINGS_FILE, "r") as f:
            lang = f.read().strip()
            if lang in ("en", "tk"):
                _current_lang = lang
    except Exception:
        pass


def tr(english_text):
    """Translate english_text to current language."""
    if _current_lang == "en":
        return english_text
    return _translations.get(english_text, english_text)


def apply_translations(main_window):
    """Apply current language translations to the main window UI elements."""
    lang = _current_lang

    if lang == "en":
        # Reset to English using Qt's retranslateUi
        main_window.retranslateUi(main_window)
        return

    # Menus
    _set_menu(main_window.uiFileMenu, "&Faýl")
    _set_menu(main_window.uiEditMenu, "&Üýtgetmek")
    _set_menu(main_window.uiViewMenu, "&Görnüş")
    _set_menu(main_window.uiControlMenu, "Dolandyryş")
    _set_menu(main_window.uiAnnotateMenu, "Bellik")
    _set_menu(main_window.uiDeviceMenu, "Enjam")
    _set_menu(main_window.uiToolsMenu, "&Gurallar")
    _set_menu(main_window.uiHelpMenu, "&Kömek")
    _set_menu(main_window.uiDocksMenu, "Paneller")

    # File menu actions
    _set_action(main_window.uiNewProjectAction, "Täze &taslama", "Täze boş taslama")
    _set_action(main_window.uiOpenProjectAction, "&Taslamany aç", "Taslamany aç")
    _set_action(main_window.uiSaveProjectAsAction, "&Başga at bilen ýatda sakla...", "Taslamany başga at bilen ýatda sakla...")
    _set_action(main_window.uiExportProjectAction, "Taslamany eksport et", "Taslamany eksport et")
    _set_action(main_window.uiImportProjectAction, "Taslamany import et", "Taslamany import et")
    _set_action(main_window.uiDeleteProjectAction, "Taslamany poz", "Taslamany poz")
    _set_action(main_window.uiQuitAction, "&Çykmak", "Programmadan çykmak")

    # Edit menu actions
    _set_action(main_window.uiSelectAllAction, "Hemmesini &saýla", "Hemmesini saýla")
    _set_action(main_window.uiSelectNoneAction, "Hiç &birini saýlama", "Saýlawlary aýyr")
    _set_action(main_window.uiPreferencesAction, "&Sazlamalar...", "Sazlamalar")
    _set_action(main_window.uiSnapshotAction, "Suratlar (snapshot)", "Suratlary dolandyr")

    # View menu actions
    _set_action(main_window.uiZoomInAction, "Ulaltmak", "Ulaltmak")
    _set_action(main_window.uiZoomOutAction, "Kiçeltmek", "Kiçeltmek")
    _set_action(main_window.uiZoomResetAction, "Ölçegi dikeltmek", "Ölçegi dikeltmek")
    _set_action(main_window.uiFitInViewAction, "Ekrana sygdyr", "Ekrana sygdyr")
    _set_action(main_window.uiActionFullscreen, "Doly ekran", "Doly ekran")
    _set_action(main_window.uiShowLayersAction, "Gatlary görkez", "Gatlary görkez")
    _set_action(main_window.uiSnapToGridAction, "Tora ýapyş", "Tora ýapyş")
    _set_action(main_window.uiShowGridAction, "Tory görkez", "Tory görkez")
    _set_action(main_window.uiResetDocksAction, "Panelleri dikelt", "Panelleri dikelt")

    # Control menu actions
    _set_action(main_window.uiStartAllAction, "Hemme enjamlary başlat", "Hemme enjamlary başlat/dowam et")
    _set_action(main_window.uiSuspendAllAction, "Hemme enjamlary togtat", "Hemme enjamlary togtat")
    _set_action(main_window.uiStopAllAction, "Hemme enjamlary duruz", "Hemme enjamlary duruz")
    _set_action(main_window.uiReloadAllAction, "Hemme enjamlary täzele", "Hemme enjamlary gaýtadan ýükle")
    _set_action(main_window.uiConsoleAllAction, "Hemme enjamlara konsol", "Hemme enjamlara konsol birikdir")
    _set_action(main_window.uiShowPortNamesAction, "Port atlaryny görkez/gizle", "Interfeýs belliklerini görkez/gizle")

    # Annotate menu actions
    _set_action(main_window.uiAddNoteAction, "Bellik goş", "Bellik goş")
    _set_action(main_window.uiInsertImageAction, "Surat goý", "Surat goý")
    _set_action(main_window.uiDrawRectangleAction, "Dürtburçluk çyz", "Dürtburçluk çyz")
    _set_action(main_window.uiDrawEllipseAction, "Ellips çyz", "Ellips çyz")
    _set_action(main_window.uiDrawLineAction, "Çyzyk çyz", "Çyzyk çyz")
    _set_action(main_window.uiLockAllAction, "Hemme zatlary gulpla/aç", "Hemme zatlary gulpla ýa-da aç")
    _set_action(main_window.uiEditReadmeAction, "Readme üýtget", "Readme üýtget")

    # Tools menu actions
    _set_action(main_window.uiScreenshotAction, "Ekran suraty al", "Ekran suraty al")
    _set_action(main_window.uiImportExportConfigsAction, "&Sazlamalary import/eksport et", "Enjam sazlamalaryny import/eksport et")

    # Help menu actions
    _set_action(main_window.uiOnlineHelpAction, "&Onlaýn kömek", "Onlaýn kömek")
    _set_action(main_window.uiCheckForUpdateAction, "&Täzelenmäni barla", "Täzelenmäni barla")
    _set_action(main_window.uiSetupWizard, "&Sazlama ussady", "Sazlama ussady")
    _set_action(main_window.uiAboutAction, "&Hakynda", "Programma hakynda")
    _set_action(main_window.uiAboutQtAction, "&Qt hakynda", "Qt hakynda")
    _set_action(main_window.uiDoctorAction, "&Barlag", "Ulgam barlagy")
    _set_action(main_window.uiExportDebugInformationAction, "Debug maglumatlaryny eksport et", "Debug maglumatlaryny eksport et")
    _set_action(main_window.uiShortcutsAction, "&Gysga ýollar", "Gysga ýollar")

    # Browsers (left toolbar)
    _set_action(main_window.uiBrowseRoutersAction, "Marşrutizatorlar", "Marşrutizatorlary görmek")
    _set_action(main_window.uiBrowseSwitchesAction, "Kommutatorlar", "Kommutatorlary görmek")
    _set_action(main_window.uiBrowseEndDevicesAction, "Ahyrky enjamlar", "Ahyrky enjamlary görmek")
    _set_action(main_window.uiBrowseSecurityDevicesAction, "Howpsuzlyk enjamlary", "Howpsuzlyk enjamlaryny görmek")
    _set_action(main_window.uiBrowseAllDevicesAction, "Hemme enjamlar", "Hemme enjamlary görmek")
    _set_action(main_window.uiAddLinkAction, "Baglanyşyk goş", "Baglanyşyk goş")

    # Other
    _set_action(main_window.uiOpenApplianceAction, "Enjam import et", "Enjam import et")
    _set_action(main_window.uiNewTemplateAction, "Täze şablon", "Täze şablon")
    _set_action(main_window.uiEditProjectAction, "Taslamany üýtget", "Taslamany üýtget")
    _set_action(main_window.uiWebUIAction, "Web UI - beta", "Web UI - beta")
    _set_action(main_window.uiResetPortLabelsAction, "Interfeýs belliklerini dikelt", "Interfeýs belliklerini dikelt")
    _set_action(main_window.uiAuxConsoleAllAction, "AUX konsol hemme enjamlara", "AUX konsol hemme enjamlara birikdir")
    _set_action(main_window.uiResetConsoleAllAction, "Hemme konsollary dikelt", "Hemme konsol birikmeleri dikelt")
    _set_action(main_window.uiResetGUIStateAction, "GUI ýagdaýyny dikelt", "GUI ýagdaýyny dikelt")

    # Toolbar titles
    main_window.uiGeneralToolBar.setWindowTitle("Esasy")
    main_window.uiBrowsersToolBar.setWindowTitle("Enjamlar")
    main_window.uiControlToolBar.setWindowTitle("Emulyasiýa")
    main_window.uiAnnotationToolBar.setWindowTitle("Çyzuw")

    # Dock widgets
    main_window.uiNodesDockWidget.setWindowTitle("Hemme şablonlar")
    main_window.uiConsoleDockWidget.setWindowTitle("Konsol")
    main_window.uiTopologySummaryDockWidget.setWindowTitle("Topologiýa")
    main_window.uiComputeSummaryDockWidget.setWindowTitle("Serwer maglumaty")

    # Other widgets
    main_window.uiNodesFilterLineEdit.setPlaceholderText("Gözleg")
    main_window.uiNewTemplatePushButton.setText("Täze şablon")


def _set_menu(menu, text):
    try:
        menu.setTitle(text)
    except Exception:
        pass


def _set_action(action, text, tooltip=None):
    try:
        action.setText(text)
        if tooltip:
            action.setToolTip(tooltip)
            action.setStatusTip(tooltip)
    except Exception:
        pass
