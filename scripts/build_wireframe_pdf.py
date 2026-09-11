from pathlib import Path

from PIL import Image, ImageDraw
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A3, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas


ROOT = Path(r"C:\Users\moham\OneDrive\Documents\Trustfund")
SOURCE_DIR = ROOT / "tmp" / "pdfs" / "wireframe_source"
ASSET_DIR = ROOT / "tmp" / "pdfs" / "wireframe_assets"
OUTPUT_DIR = ROOT / "output" / "pdf"
EXTRA_DIR = ROOT / "tmp" / "pdfs" / "wireframe_extra_raw"
OUTPUT_PDF = OUTPUT_DIR / "TrustFund_Wireframe_12_Planches.pdf"


SCREENS = [
    "Écran de démarrage",
    "Bienvenue",
    "Connexion unique",
    "Comptes de démonstration",
    "Créer un compte · Choisir un rôle",
    "Créer un compte · Informations",
    "Créer un compte · Mot de passe",
    "Vérification par SMS",
    "Tableau de bord utilisateur",
    "Mes objectifs",
    "Détail d’un objectif",
    "Créer un objectif · Étape 1",
    "Créer un objectif · Plan de cotisation",
    "Boutique",
    "Fiche produit",
    "Paiement",
    "Déclarer une cotisation",
    "Retrait de fonds",
    "Historique des activités",
    "Notifications",
    "Finalisation de commande",
    "TrustCoach · Assistant IA",
    "Mon analyse IA",
    "Profil utilisateur",
    "Aide & support",
    "Tableau de bord fournisseur",
    "Mes offres",
    "Nouveau produit · Informations",
    "Nouveau produit · Prix et stock",
    "Nouveau produit · Finalisation",
    "Commandes fournisseur",
    "Réclamations fournisseur",
    "Suivi fournisseur via TrustFund",
    "Dossier fournisseur",
    "Profil fournisseur",
    "Centre de contrôle administrateur",
    "Vérification assistée",
    "Comptes utilisateurs",
    "Gérer un compte",
    "Partenaires fournisseurs",
    "Décision fournisseur",
    "Réclamations",
    "Dossier réclamation",
    "Statistiques",
    "Vérifier la disponibilité",
    "Vérification d’identité",
    "Affecter l’épargne disponible",
    "Comprendre le fonctionnement des fonds",
    "Conditions d’utilisation",
    "Politique de confidentialité",
    "Créer une réclamation",
    "Récupérer le mot de passe",
    "Modifier le profil utilisateur",
    "Gérer un objectif",
    "Détail d’une commande fournisseur",
    "Répondre et clôturer une réclamation",
    "Signaler un problème sur une preuve",
    "Profil administrateur",
    "Rôle et autorisations administrateur",
    "Confirmer la réception du produit",
    "Compte créé - connexion requise",
    "Connexion du nouveau compte",
    "Mot de passe oublié · Choisir le canal",
    "Mot de passe oublié · Saisir le code",
    "Mot de passe oublié · Nouveau mot de passe",
    "Mot de passe modifié · Reconnexion",
    "Utilisateur · Contacter TrustFund",
    "Admin · Demande de disponibilité reçue",
    "Fournisseur · Vérification TrustFund",
    "Admin · Répondre à l’utilisateur",
    "Utilisateur · Réponse de TrustFund",
]


SECTIONS = [
    ("Accès au service", "Démarrage · accueil · connexion · rôle"),
    ("Création de compte", "Identité · sécurité · vérification · premier accès"),
    ("Objectifs & catalogue", "Projet d’épargne · plan · boutique · produit"),
    ("Paiements & suivi", "Paiement · cotisation · retrait · activité · alertes"),
    ("Accompagnement utilisateur", "Commande · assistant IA · analyse · profil · aide"),
    ("Espace fournisseur", "Accueil · catalogue · création d’une offre"),
    ("Opérations fournisseur", "Commandes · réclamations · dossier · profil"),
    ("Administration & contrôle", "Vérification · comptes · partenaires"),
    ("Décisions & pilotage", "Décisions · réclamations · statistiques · contact"),
    ("Sécurité, épargne & cadre légal", "Identité · affectation · fonctionnement · conditions · confidentialité"),
    ("Assistance & gestion du compte", "Réclamation · récupération · profil · objectif · commande"),
    ("Contrôle & finalisation", "Réponse · preuve · accès administrateur · réception du produit"),
]


def register_fonts() -> tuple[str, str]:
    regular = Path(r"C:\Windows\Fonts\segoeui.ttf")
    semibold = Path(r"C:\Windows\Fonts\seguisb.ttf")
    if regular.exists() and semibold.exists():
        pdfmetrics.registerFont(TTFont("SegoeUI", str(regular)))
        pdfmetrics.registerFont(TTFont("SegoeUISemibold", str(semibold)))
        return "SegoeUI", "SegoeUISemibold"
    return "Helvetica", "Helvetica-Bold"


def prepare_images() -> list[Path]:
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    results: list[Path] = []
    for index in range(1, len(SCREENS) + 1):
        src = SOURCE_DIR / f"screen-{index:02d}.png" if index <= 45 else EXTRA_DIR / f"screen-{index:02d}.png"
        dst = ASSET_DIR / f"wireframe-{index:02d}.jpg"
        if not src.exists():
            raise FileNotFoundError(f"Capture source introuvable : {src}")

        with Image.open(src) as image:
            image = image.convert("RGB")
            width, height = image.size
            if index <= 45:
                # Retire le titre de la page source pour utiliser une légende plus lisible.
                crop_height = int(height * 0.89)
                image = image.crop((0, 0, width, crop_height))

            # Ajoute une bordure très légère pour garder chaque écran distinct.
            framed = Image.new("RGB", (image.width + 12, image.height + 12), "#FFFFFF")
            framed.paste(image, (6, 6))
            draw = ImageDraw.Draw(framed)
            draw.rounded_rectangle(
                (1, 1, framed.width - 2, framed.height - 2),
                radius=18,
                outline="#D8D8D5",
                width=2,
            )
            framed.save(dst, "JPEG", quality=94, optimize=True, progressive=True)
        results.append(dst)
    return results


def draw_header(canvas: Canvas, page_index: int, regular: str, semibold: str) -> None:
    page_width, page_height = landscape(A3)
    section, subtitle = SECTIONS[page_index]

    canvas.setFillColor(HexColor("#121212"))
    canvas.setFont(semibold, 10)
    canvas.drawString(46, page_height - 42, "TRUSTFUND  ·  WIREFRAME DU PROTOTYPE")

    canvas.setFont(semibold, 23)
    canvas.drawString(46, page_height - 72, section)
    canvas.setFillColor(HexColor("#666662"))
    canvas.setFont(regular, 10.5)
    canvas.drawString(46, page_height - 92, subtitle)

    canvas.setFillColor(HexColor("#121212"))
    canvas.setFont(semibold, 12)
    canvas.drawRightString(page_width - 46, page_height - 54, f"{page_index + 1:02d} / 12")

    canvas.setStrokeColor(HexColor("#D7D7D2"))
    canvas.setLineWidth(0.8)
    canvas.line(46, page_height - 108, page_width - 46, page_height - 108)


def draw_tile(
    canvas: Canvas,
    image_path: Path,
    screen_number: int,
    title: str,
    x: float,
    y: float,
    regular: str,
    semibold: str,
) -> None:
    tile_width = 238
    tile_height = 326
    image_height = 286
    radius = 13

    # Ombre douce.
    canvas.setFillColor(HexColor("#D9D9D5"))
    canvas.roundRect(x + 3, y - 3, tile_width, tile_height, radius, fill=1, stroke=0)

    canvas.setFillColor(HexColor("#FFFFFF"))
    canvas.setStrokeColor(HexColor("#D8D8D3"))
    canvas.setLineWidth(0.7)
    canvas.roundRect(x, y, tile_width, tile_height, radius, fill=1, stroke=1)

    image_padding = 8
    canvas.drawImage(
        str(image_path),
        x + image_padding,
        y + tile_height - image_height - image_padding,
        width=tile_width - (2 * image_padding),
        height=image_height,
        preserveAspectRatio=True,
        anchor="c",
        mask="auto",
    )

    badge_x = x + 12
    badge_y = y + 10
    canvas.setFillColor(HexColor("#111111"))
    canvas.roundRect(badge_x, badge_y, 28, 20, 7, fill=1, stroke=0)
    canvas.setFillColor(HexColor("#FFFFFF"))
    canvas.setFont(semibold, 8.5)
    canvas.drawCentredString(badge_x + 14, badge_y + 6.1, f"{screen_number:02d}")

    canvas.setFillColor(HexColor("#161616"))
    canvas.setFont(semibold, 9.6)
    max_width = tile_width - 58
    text = title
    while canvas.stringWidth(text, semibold, 9.6) > max_width and len(text) > 8:
        text = text[:-1]
    if text != title:
        text = text.rstrip(" ·-") + "…"
    canvas.drawString(x + 48, y + 16, text)


def build_pdf(images: list[Path]) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    regular, semibold = register_fonts()
    page_width, page_height = landscape(A3)
    canvas = Canvas(str(OUTPUT_PDF), pagesize=(page_width, page_height), pageCompression=1)
    canvas.setTitle("TrustFund — Wireframe du prototype")
    canvas.setAuthor("TrustFund")
    canvas.setSubject("60 écrans regroupés sur 12 planches de workflow")

    top_y = 405
    bottom_y = 57
    top_x = [198, 476, 754]
    bottom_x = [337, 615]

    for page_index in range(12):
        canvas.setFillColor(HexColor("#F4F3EF"))
        canvas.rect(0, 0, page_width, page_height, fill=1, stroke=0)
        draw_header(canvas, page_index, regular, semibold)

        start = page_index * 5
        page_items = list(range(start, start + 5))
        positions = [(x, top_y) for x in top_x] + [(x, bottom_y) for x in bottom_x]
        for item_index, (x, y) in zip(page_items, positions):
            draw_tile(
                canvas,
                images[item_index],
                item_index + 1,
                SCREENS[item_index],
                x,
                y,
                regular,
                semibold,
            )

        canvas.setFillColor(HexColor("#70706C"))
        canvas.setFont(regular, 8.2)
        canvas.drawRightString(page_width - 46, 24, "Prototype fonctionnel · Vue synthétique du parcours")
        canvas.showPage()

    canvas.save()
    return OUTPUT_PDF


if __name__ == "__main__":
    prepared_images = prepare_images()
    output = build_pdf(prepared_images)
    print(output)
