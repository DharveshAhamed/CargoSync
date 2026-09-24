"""
CargoSync — PDF Loading Sheet Generator
Creates a printable loading order sheet with box placement guide.
"""

import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


def generate_loading_sheet(job, truck, boxes) -> io.BytesIO:
    """
    Generate a PDF loading order sheet.

    Boxes are listed in reverse delivery order (loaded first = at the back of truck).
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1.5 * cm, bottomMargin=1.5 * cm)
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Title"],
        fontSize=18,
        textColor=colors.HexColor("#3D3631"),
    )
    subtitle_style = ParagraphStyle(
        "CustomSubtitle",
        parent=styles["Heading2"],
        fontSize=12,
        textColor=colors.HexColor("#7A6F66"),
    )

    elements = []

    # Title
    elements.append(Paragraph("CargoSync — Loading Order Sheet", title_style))
    elements.append(Spacer(1, 0.5 * cm))

    # Job info
    elements.append(Paragraph(f"<b>Job:</b> {job.job_name}", styles["Normal"]))
    elements.append(Paragraph(f"<b>Date:</b> {job.date}", styles["Normal"]))
    if truck:
        elements.append(
            Paragraph(
                f"<b>Truck:</b> {truck.truck_name} ({truck.plate_number}) — "
                f"{truck.length_cm}×{truck.width_cm}×{truck.height_cm} cm, "
                f"Max: {truck.max_weight_kg} kg",
                styles["Normal"],
            )
        )
    elements.append(Spacer(1, 0.5 * cm))

    # Loading order header
    elements.append(Paragraph("Loading Order (Load in this sequence):", subtitle_style))
    elements.append(Spacer(1, 0.3 * cm))

    # Table header
    table_data = [
        ["#", "Label", "Dimensions (cm)", "Weight", "Stop", "Fragile", "Hazard"]
    ]

    # Boxes in reverse delivery order (loaded first at back of truck)
    sorted_boxes = sorted(boxes, key=lambda b: -b.stop_order)
    total_weight = 0

    for i, box in enumerate(sorted_boxes, 1):
        dims = f"{box.length_cm} × {box.width_cm} × {box.height_cm}"
        total_weight += box.weight_kg
        table_data.append([
            str(i),
            box.label_reference,
            dims,
            f"{box.weight_kg} kg",
            f"Stop {box.stop_order}",
            "⚠ YES" if box.fragile else "No",
            "☢ YES" if box.hazard else "No",
        ])

    # Summary row
    table_data.append(["", f"Total: {len(sorted_boxes)} boxes", "", f"{total_weight:.1f} kg", "", "", ""])

    # Create table
    table = Table(table_data, colWidths=[1.2 * cm, 4 * cm, 4 * cm, 2.5 * cm, 2 * cm, 2 * cm, 2 * cm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#C17B4A")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E8DDD4")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.HexColor("#FFFBF5")]),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#F5F0EB")),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))

    elements.append(table)
    elements.append(Spacer(1, 1 * cm))

    # Notes
    elements.append(Paragraph("<b>Notes:</b>", styles["Normal"]))
    elements.append(
        Paragraph(
            "• Load boxes in the order listed above (highest stop number first, at the back of the truck).",
            styles["Normal"],
        )
    )
    elements.append(
        Paragraph(
            "• Fragile items should be placed on top of non-fragile items.",
            styles["Normal"],
        )
    )
    elements.append(
        Paragraph(
            "• Scan each box's QR code during loading to validate the manifest.",
            styles["Normal"],
        )
    )

    doc.build(elements)
    buffer.seek(0)
    return buffer
