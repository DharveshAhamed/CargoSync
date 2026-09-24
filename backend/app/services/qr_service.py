"""
CargoSync — QR Code generation service
Generates QR codes as SVG strings for printable labels.
"""

import json
import qrcode
import qrcode.image.svg
from io import BytesIO


def generate_qr_data(box, job) -> str:
    """Generate the data to encode in a QR code for a box."""
    return json.dumps({
        "box_id": box.id,
        "job_id": job.id,
        "label": box.label_reference,
        "stop_order": box.stop_order,
        "fragile": box.fragile,
        "hazard": box.hazard,
    })


def generate_qr_code_svg(data: str, label: str = "") -> str:
    """Generate a QR code as an SVG string with a label underneath."""
    factory = qrcode.image.svg.SvgPathImage
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(image_factory=factory)
    buffer = BytesIO()
    img.save(buffer)
    svg_content = buffer.getvalue().decode("utf-8")

    # Add a label beneath the QR code
    if label:
        # Parse SVG dimensions and add text element
        svg_content = svg_content.replace(
            "</svg>",
            f'<text x="50%" y="98%" text-anchor="middle" '
            f'font-family="Arial, sans-serif" font-size="14" '
            f'font-weight="bold" fill="#333">{label}</text></svg>'
        )

    return svg_content
