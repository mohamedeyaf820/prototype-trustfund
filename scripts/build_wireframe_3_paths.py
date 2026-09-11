from pathlib import Path

from PIL import Image, ImageDraw
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A2, landscape
from reportlab.pdfgen.canvas import Canvas

from build_wireframe_pdf import EXTRA_DIR, ROOT, SCREENS, SOURCE_DIR, register_fonts


ASSET_DIR = ROOT / "tmp" / "pdfs" / "wireframe_flow_assets"
WEB_RAW_DIR = ROOT / "tmp" / "pdfs" / "wireframe_web_raw"
WEB_ASSET_DIR = ROOT / "tmp" / "pdfs" / "wireframe_web_assets"
OUTPUT_DIR = ROOT / "output" / "pdf"
OUTPUT_PDF = OUTPUT_DIR / "TrustFund_Wireframe_3_Parcours.pdf"


JOURNEYS = {
    "user": {
        "number": "01",
        "label": "UTILISATEUR",
        "pages": [
            ("Accès et choix du compte", [1, 2, 3, 4, 5]),
            ("Création du compte, SMS et connexion obligatoire", [6, 7, 8, 61, 62]),
            ("Récupération du mot de passe et reconnexion", [63, 64, 65, 66, 9]),
            ("Objectifs, plan d’épargne et catalogue", [10, 11, 12, 13, 14]),
            ("Produit, disponibilité via TrustFund et cotisation", [15, 67, 71, 16, 17]),
            ("Retrait, suivi, commande et accompagnement", [18, 19, 20, 21, 22]),
            ("Analyse, profil, assistance et gestion de l’épargne", [23, 24, 25, 46, 47]),
            ("Fonctionnement, cadre légal et réception", [48, 49, 50, 51, 60]),
        ],
    },
    "provider": {
        "number": "02",
        "label": "FOURNISSEUR",
        "pages": [
            ("Accès sécurisé et création d’une offre", [3, 63, 26, 27, 28]),
            ("Publication, commandes et demande TrustFund", [29, 30, 31, 55, 69]),
            ("Réclamations, dossier et conformité", [32, 33, 34, 35, 50]),
        ],
    },
    "admin": {
        "number": "03",
        "label": "ADMINISTRATEUR",
        "pages": [
            ("Connexion, contrôle et comptes", [3, 36, 37, 38, 39]),
            ("Partenaires, réclamations et statistiques", [40, 41, 42, 43, 44]),
            ("Disponibilité, réponse, preuves et autorisations", [68, 70, 56, 57, 59]),
        ],
    },
}


WEB_JOURNEYS = {
    "provider_web": {
        "number": "04",
        "label": "FOURNISSEUR - WEB",
        "prefix": "provider-web",
        "pages": [
            ("Pilotage de l'activité", [
                "Tableau de bord fournisseur - Web",
                "Mes offres - Web",
            ]),
            ("Création d'un produit - contenu", [
                "Nouveau produit - Informations",
                "Nouveau produit - Description",
            ]),
            ("Création d'un produit - commercialisation", [
                "Nouveau produit - Prix et stock",
                "Nouveau produit - Finalisation",
            ]),
            ("Commandes et livraison", [
                "Commandes fournisseur - Web",
                "Détail d'une commande - Web",
            ]),
            ("Service après-vente", [
                "Réclamations fournisseur - Web",
                "Répondre à une réclamation - Web",
            ]),
            ("Conformité et échanges avec TrustFund", [
                "Dossier fournisseur - Web",
                "Demande TrustFund - Web",
            ]),
            ("Compte et sécurité", [
                "Profil fournisseur - Web",
                "Sécurité fournisseur - Web",
            ]),
        ],
    },
    "admin_web": {
        "number": "05",
        "label": "ADMINISTRATEUR - WEB",
        "prefix": "admin-web",
        "pages": [
            ("Pilotage et contrôles", [
                "Centre de contrôle - Web",
                "Vérifications et alertes IA - Web",
            ]),
            ("Gestion des utilisateurs", [
                "Comptes utilisateurs - Web",
                "Suspendre ou limiter un compte",
            ]),
            ("Validation des partenaires", [
                "Partenaires fournisseurs - Web",
                "Demander un document complémentaire",
            ]),
            ("Supervision des opérations", [
                "Supervision des objectifs - Web",
                "Suivi des commandes - Web",
            ]),
            ("Réclamations et disponibilité", [
                "Réclamations - Web",
                "Demande de disponibilité reçue",
            ]),
            ("Réponses et traitement", [
                "Répondre à l'utilisateur",
                "Traiter une réclamation",
            ]),
            ("Rapports et modèle économique", [
                "Rapports et export - Web",
                "Réglage des frais - Web",
            ]),
            ("Traçabilité et profil", [
                "Journal d'audit - Web",
                "Profil administrateur - Web",
            ]),
            ("Administration du compte", [
                "Modifier le profil administrateur",
                "Rôles et autorisations",
            ]),
            ("Preuves et notifications", [
                "Signaler une preuve incorrecte",
                "Notifications administrateur - Web",
            ]),
        ],
    },
}


def prepare_images() -> dict[int, Path]:
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    output: dict[int, Path] = {}
    required = sorted({number for journey in JOURNEYS.values() for _, numbers in journey["pages"] for number in numbers})

    for number in required:
        source = SOURCE_DIR / f"screen-{number:02d}.png" if number <= 45 else EXTRA_DIR / f"screen-{number:02d}.png"
        destination = ASSET_DIR / f"flow-{number:02d}.jpg"
        if not source.exists():
            raise FileNotFoundError(f"Capture source introuvable : {source}")

        with Image.open(source) as original:
            # Le document livré reste strictement noir, blanc et niveaux de gris,
            # même pour les anciennes captures prises avant le thème monochrome.
            image = original.convert("L").convert("RGB")
            width, height = image.size
            bottom = int(height * 0.89) if number <= 45 else height
            if number > 45 and number not in {68, 69, 70}:
                left = int(width * 0.35)
                right = int(width * 0.65)
            else:
                left = int(width * 0.24)
                right = int(width * 0.76)
            image = image.crop((left, 0, right, bottom))

            framed = Image.new("RGB", (image.width + 14, image.height + 14), "#FFFFFF")
            framed.paste(image, (7, 7))
            draw = ImageDraw.Draw(framed)
            draw.rounded_rectangle(
                (1, 1, framed.width - 2, framed.height - 2),
                radius=20,
                outline="#D0D0D0",
                width=2,
            )
            framed.save(destination, "JPEG", quality=95, optimize=True, progressive=True)
        output[number] = destination

    return output


def prepare_web_images() -> dict[str, Path]:
    WEB_ASSET_DIR.mkdir(parents=True, exist_ok=True)
    output: dict[str, Path] = {}
    for journey in WEB_JOURNEYS.values():
        prefix = journey["prefix"]
        titles = [title for _, page_titles in journey["pages"] for title in page_titles]
        for number, _ in enumerate(titles, start=1):
            key = f"{prefix}-{number:02d}"
            source = WEB_RAW_DIR / f"{key}.png"
            destination = WEB_ASSET_DIR / f"{key}.jpg"
            if not source.exists():
                raise FileNotFoundError(f"Capture web introuvable : {source}")

            with Image.open(source) as original:
                image = original.convert("L").convert("RGB")
                framed = Image.new("RGB", (image.width + 16, image.height + 16), "#FFFFFF")
                framed.paste(image, (8, 8))
                draw = ImageDraw.Draw(framed)
                draw.rounded_rectangle(
                    (1, 1, framed.width - 2, framed.height - 2),
                    radius=20,
                    outline="#C8C8C8",
                    width=2,
                )
                framed.save(destination, "JPEG", quality=96, optimize=True, progressive=True)
            output[key] = destination
    return output


def fit_title(canvas: Canvas, text: str, font: str, size: float, max_width: float) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if not current or canvas.stringWidth(candidate, font, size) <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    if len(lines) > 2:
        lines = lines[:2]
        while canvas.stringWidth(lines[1] + "…", font, size) > max_width and len(lines[1]) > 4:
            lines[1] = lines[1][:-1]
        lines[1] = lines[1].rstrip(" ·-") + "…"
    return lines


def draw_arrow(canvas: Canvas, x1: float, x2: float, y: float) -> None:
    canvas.setStrokeColor(HexColor("#777777"))
    canvas.setFillColor(HexColor("#777777"))
    canvas.setLineWidth(1.7)
    canvas.line(x1, y, x2 - 7, y)
    canvas.line(x2 - 7, y, x2 - 13, y + 4)
    canvas.line(x2 - 7, y, x2 - 13, y - 4)


def draw_card(
    canvas: Canvas,
    image_path: Path,
    screen_number: int,
    step_number: int,
    x: float,
    y: float,
    width: float,
    height: float,
    regular: str,
    semibold: str,
) -> None:
    radius = 16
    label_height = 76
    padding = 12

    canvas.setFillColor(HexColor("#D7D7D7"))
    canvas.roundRect(x + 4, y - 4, width, height, radius, fill=1, stroke=0)
    canvas.setFillColor(HexColor("#FFFFFF"))
    canvas.setStrokeColor(HexColor("#D0D0D0"))
    canvas.setLineWidth(0.8)
    canvas.roundRect(x, y, width, height, radius, fill=1, stroke=1)

    canvas.setFillColor(HexColor("#555555"))
    canvas.setFont(semibold, 9)
    canvas.drawString(x + 15, y + height - 24, f"ÉTAPE {step_number:02d}")
    canvas.setFillColor(HexColor("#777777"))
    canvas.setFont(regular, 8)
    canvas.drawRightString(x + width - 15, y + height - 24, f"Écran {screen_number:02d}")

    image_y = y + label_height
    image_height = height - label_height - 42
    canvas.drawImage(
        str(image_path),
        x + padding,
        image_y,
        width=width - (2 * padding),
        height=image_height,
        preserveAspectRatio=True,
        anchor="c",
        mask="auto",
    )

    canvas.setFillColor(HexColor("#111111"))
    lines = fit_title(canvas, SCREENS[screen_number - 1], semibold, 10.5, width - 30)
    title_y = y + 38 if len(lines) == 1 else y + 45
    for line_index, line in enumerate(lines):
        canvas.setFont(semibold, 10.5)
        canvas.drawCentredString(x + width / 2, title_y - (line_index * 14), line)


def draw_web_card(
    canvas: Canvas,
    image_path: Path,
    title: str,
    view_number: int,
    x: float,
    y: float,
    width: float,
    height: float,
    regular: str,
    semibold: str,
) -> None:
    radius = 17
    padding = 14
    image_top_space = 52
    title_space = 70

    canvas.setFillColor(HexColor("#D7D7D7"))
    canvas.roundRect(x + 5, y - 5, width, height, radius, fill=1, stroke=0)
    canvas.setFillColor(HexColor("#FFFFFF"))
    canvas.setStrokeColor(HexColor("#C9C9C9"))
    canvas.setLineWidth(0.9)
    canvas.roundRect(x, y, width, height, radius, fill=1, stroke=1)

    canvas.setFillColor(HexColor("#111111"))
    canvas.setFont(semibold, 9.5)
    canvas.drawString(x + 17, y + height - 31, f"VUE WEB {view_number:02d}")
    canvas.setFillColor(HexColor("#FFFFFF"))
    canvas.roundRect(x + width - 58, y + height - 39, 41, 22, 7, fill=1, stroke=1)
    canvas.setFillColor(HexColor("#444444"))
    canvas.setFont(semibold, 8)
    canvas.drawCentredString(x + width - 37.5, y + height - 31.5, "WEB")

    image_x = x + padding
    image_y = y + title_space
    image_width = width - (2 * padding)
    image_height = height - title_space - image_top_space
    canvas.drawImage(
        str(image_path),
        image_x,
        image_y,
        width=image_width,
        height=image_height,
        preserveAspectRatio=True,
        anchor="c",
        mask="auto",
    )

    canvas.setFillColor(HexColor("#111111"))
    lines = fit_title(canvas, title, semibold, 13, width - 42)
    title_y = y + 39 if len(lines) == 1 else y + 47
    for line_index, line in enumerate(lines):
        canvas.setFont(semibold, 13)
        canvas.drawCentredString(x + width / 2, title_y - (line_index * 16), line)


def flatten_pages():
    pages = []
    for journey_key, journey in JOURNEYS.items():
        total = len(journey["pages"])
        for journey_page, (topic, screens) in enumerate(journey["pages"], start=1):
            pages.append(
                {
                    "kind": "mobile",
                    "journey_key": journey_key,
                    "journey_number": journey["number"],
                    "journey_label": journey["label"],
                    "journey_page": journey_page,
                    "journey_total": total,
                    "topic": topic,
                    "screens": screens,
                }
            )
    for journey_key, journey in WEB_JOURNEYS.items():
        total = len(journey["pages"])
        view_number = 1
        for journey_page, (topic, titles) in enumerate(journey["pages"], start=1):
            pages.append(
                {
                    "kind": "web",
                    "journey_key": journey_key,
                    "journey_number": journey["number"],
                    "journey_label": journey["label"],
                    "journey_page": journey_page,
                    "journey_total": total,
                    "topic": topic,
                    "prefix": journey["prefix"],
                    "titles": titles,
                    "view_numbers": [view_number, view_number + 1],
                }
            )
            view_number += 2
    return pages


def build_pdf(images: dict[int, Path], web_images: dict[str, Path]) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    regular, semibold = register_fonts()
    page_width, page_height = landscape(A2)
    pages = flatten_pages()
    canvas = Canvas(str(OUTPUT_PDF), pagesize=(page_width, page_height), pageCompression=1)
    canvas.setTitle("TrustFund - Wireframe organisé en 3 parcours - Mobile et Web")
    canvas.setAuthor("TrustFund")
    canvas.setSubject("Parcours utilisateur, fournisseur et administrateur - Mobile et Web")

    margin = 54
    gap = 22
    card_width = (page_width - (2 * margin) - (4 * gap)) / 5
    card_height = 800
    card_y = 205

    journey_offsets = {"user": 0, "provider": 0, "admin": 0}
    for document_page, page in enumerate(pages, start=1):
        canvas.setFillColor(HexColor("#F4F4F4"))
        canvas.rect(0, 0, page_width, page_height, fill=1, stroke=0)

        canvas.setFillColor(HexColor("#111111"))
        canvas.setFont(semibold, 10)
        canvas.drawString(margin, page_height - 45, f"TRUSTFUND  /  PARCOURS {page['journey_number']}")
        canvas.setFont(semibold, 28)
        canvas.drawString(margin, page_height - 82, f"PARCOURS {page['journey_label']}")
        canvas.setFillColor(HexColor("#626262"))
        canvas.setFont(regular, 13)
        canvas.drawString(margin, page_height - 108, page["topic"])

        canvas.setFillColor(HexColor("#111111"))
        canvas.setFont(semibold, 12)
        canvas.drawRightString(
            page_width - margin,
            page_height - 54,
            f"{page['journey_page']:02d} / {page['journey_total']:02d}",
        )
        canvas.setFillColor(HexColor("#777777"))
        canvas.setFont(regular, 9)
        canvas.drawRightString(page_width - margin, page_height - 75, f"Document {document_page:02d} / {len(pages):02d}")

        canvas.setStrokeColor(HexColor("#CECECE"))
        canvas.setLineWidth(0.9)
        canvas.line(margin, page_height - 130, page_width - margin, page_height - 130)

        if page["kind"] == "mobile":
            base_step = journey_offsets[page["journey_key"]]
            positions = [margin + index * (card_width + gap) for index in range(5)]
            for index in range(4):
                draw_arrow(canvas, positions[index] + card_width + 4, positions[index + 1] - 4, card_y + card_height / 2)

            for index, (screen_number, x) in enumerate(zip(page["screens"], positions), start=1):
                draw_card(
                    canvas,
                    images[screen_number],
                    screen_number,
                    base_step + index,
                    x,
                    card_y,
                    card_width,
                    card_height,
                    regular,
                    semibold,
                )
            journey_offsets[page["journey_key"]] += 5
            footer_left = f"Étapes {base_step + 1:02d} à {base_step + 5:02d}"
        else:
            web_gap = 30
            web_width = (page_width - (2 * margin) - web_gap) / 2
            web_height = 748
            web_y = 232
            positions = [margin, margin + web_width + web_gap]
            draw_arrow(canvas, positions[0] + web_width + 5, positions[1] - 5, web_y + web_height / 2)
            for title, view_number, x in zip(page["titles"], page["view_numbers"], positions):
                key = f"{page['prefix']}-{view_number:02d}"
                draw_web_card(
                    canvas,
                    web_images[key],
                    title,
                    view_number,
                    x,
                    web_y,
                    web_width,
                    web_height,
                    regular,
                    semibold,
                )
            footer_left = f"Vues web {page['view_numbers'][0]:02d} et {page['view_numbers'][1]:02d}"

        canvas.setFillColor(HexColor("#696969"))
        canvas.setFont(regular, 9.5)
        canvas.drawString(margin, 46, footer_left)
        canvas.drawRightString(page_width - margin, 46, "Ordre de lecture : de gauche à droite")
        canvas.showPage()

    canvas.save()
    return OUTPUT_PDF


if __name__ == "__main__":
    assets = prepare_images()
    web_assets = prepare_web_images()
    print(build_pdf(assets, web_assets))
