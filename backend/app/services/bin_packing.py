"""
CargoSync — 3D Bin Packing Algorithm
Uses First Fit Decreasing Height (FFDH) with reverse delivery sequencing.

Boxes loaded LAST are delivered FIRST (reverse delivery order).
Fragile items are always placed on top.
"""

from typing import List, Dict


def pack_boxes_3d(truck: Dict, boxes: List[Dict], existing_placements: List[Dict] = None) -> Dict:
    """
    3D bin packing algorithm with reverse delivery sequencing and multi-job placement support.

    Args:
        truck: {"length": cm, "width": cm, "height": cm, "max_weight": kg}
        boxes: [{"id", "label", "length", "width", "height", "weight", "stop_order", "fragile"}]
        existing_placements: Optional list of boxes already placed in the truck from previous active jobs:
            [{"id", "label", "x", "y", "z", "length", "width", "height", "weight", "job_id", "job_name", ...}]

    Returns:
        {
            "placements": [...],                # current job placements
            "previous_placements": [...],       # cargo from previous jobs in this truck
            "unpacked": [...],
            "efficiency": float (0-100),
            "total_weight": float,
            "current_job_weight": float,
            "previous_jobs_weight": float,
            "weight_capacity_used": float,
            "truck_dimensions": {...}
        }
    """
    truck_l = float(truck["length"])
    truck_w = float(truck["width"])
    truck_h = float(truck["height"])
    max_weight = float(truck["max_weight"])

    existing_placements = existing_placements or []

    # Total weight begins with existing cargo from other accepted jobs in this truck
    previous_jobs_weight = sum(float(p.get("weight", 0.0)) for p in existing_placements)
    total_weight = previous_jobs_weight
    current_job_weight = 0.0

    # Occupied 3D cuboids list: (x, y, z, length, height, width)
    # length = X axis, height = Y axis, width = Z axis
    occupied_cuboids = [
        (
            float(p["x"]),
            float(p["y"]),
            float(p["z"]),
            float(p["length"]),
            float(p["height"]),
            float(p["width"]),
        )
        for p in existing_placements
    ]

    def cuboids_overlap(x1, y1, z1, l1, h1, w1, x2, y2, z2, l2, h2, w2):
        """Check if two 3D boxes intersect with a tiny margin to prevent collision."""
        margin = 0.05
        return not (
            x1 + l1 <= x2 + margin or x2 + l2 <= x1 + margin or
            y1 + h1 <= y2 + margin or y2 + h2 <= y1 + margin or
            z1 + w1 <= z2 + margin or z2 + w2 <= z1 + margin
        )

    def is_valid_position(cx, cy, cz, cl, ch, cw):
        """Verify candidate box fits inside truck and does not intersect any placed cargo."""
        if cx + cl > truck_l or cy + ch > truck_h or cz + cw > truck_w:
            return False
        if cx < 0 or cy < 0 or cz < 0:
            return False
        for ox, oy, oz, ol, oh, ow in occupied_cuboids:
            if cuboids_overlap(cx, cy, cz, cl, ch, cw, ox, oy, oz, ol, oh, ow):
                return False
        return True

    def find_position(box_l, box_w, box_h, box_weight):
        """Find the optimal position (lowest Y, then closest X, then Z) using corner anchor points."""
        nonlocal total_weight, current_job_weight

        # Check total weight capacity
        if total_weight + box_weight > max_weight:
            return None

        # Build candidate anchor points from container origin and boundaries of all placed boxes
        xs = {0.0}
        ys = {0.0}
        zs = {0.0}
        for ox, oy, oz, ol, oh, ow in occupied_cuboids:
            if ox + ol <= truck_l:
                xs.add(round(ox + ol, 1))
            if oy + oh <= truck_h:
                ys.add(round(oy + oh, 1))
            if oz + ow <= truck_w:
                zs.add(round(oz + ow, 1))

        # Sort candidate anchor points: lowest height (Y) first for stability, then back (X), then side (Z)
        candidate_points = sorted(
            [(y, x, z) for y in ys for x in xs for z in zs],
            key=lambda pt: (pt[0], pt[1], pt[2]),
        )

        for cy, cx, cz in candidate_points:
            if is_valid_position(cx, cy, cz, box_l, box_h, box_w):
                occupied_cuboids.append((cx, cy, cz, box_l, box_h, box_w))
                total_weight += box_weight
                current_job_weight += box_weight
                return (cx, cy, cz)

        return None

    # Sort current job boxes:
    # 1. Non-fragile first (bottom)
    # 2. Reverse delivery order (highest stop_order loaded first)
    # 3. Largest volume first for tight packing
    sorted_boxes = sorted(
        boxes,
        key=lambda b: (
            b.get("fragile", False),
            -b.get("stop_order", 1),
            -(float(b["length"]) * float(b["width"]) * float(b["height"])),
        ),
    )

    placements = []
    unpacked = []

    # Pack each box
    for box in sorted_boxes:
        dims = float(box["length"]), float(box["width"]), float(box["height"])
        box_wt = float(box.get("weight", 0.0))

        # Try orientations (Original, Rotated 90° on Y, on X, etc.)
        orientations = [
            (dims[0], dims[1], dims[2], 0),  # Original (L, W, H)
            (dims[1], dims[0], dims[2], 1),  # Rotated 90° on Y
            (dims[0], dims[2], dims[1], 2),  # Rotated on X
            (dims[2], dims[1], dims[0], 3),  # Rotated on Z
            (dims[1], dims[2], dims[0], 4),  # Rotated XY
            (dims[2], dims[0], dims[1], 5),  # Rotated XZ
        ]

        placed = False
        for l, w, h, rotation in orientations:
            if l > truck_l or w > truck_w or h > truck_h:
                continue

            pos = find_position(l, w, h, box_wt)
            if pos:
                x, y, z = pos
                placements.append({
                    "id": box["id"],
                    "label": box["label"],
                    "x": round(x, 1),
                    "y": round(y, 1),
                    "z": round(z, 1),
                    "length": round(l, 1),
                    "width": round(w, 1),
                    "height": round(h, 1),
                    "rotation": rotation,
                    "stop_order": box.get("stop_order", 1),
                    "fragile": box.get("fragile", False),
                    "job_id": box.get("job_id"),
                    "job_name": box.get("job_name"),
                    "is_previous_job": False,
                })
                placed = True
                break

        if not placed:
            unpacked.append({
                "id": box["id"],
                "label": box["label"],
                "reason": "No space available in truck" if total_weight < max_weight else "Truck weight limit exceeded",
            })

    # Calculate metrics across ALL cargo in the truck (previous + current)
    truck_volume = truck_l * truck_w * truck_h
    current_packed_volume = sum(p["length"] * p["width"] * p["height"] for p in placements)
    previous_packed_volume = sum(float(p["length"]) * float(p["width"]) * float(p["height"]) for p in existing_placements)
    total_packed_volume = current_packed_volume + previous_packed_volume

    efficiency = (total_packed_volume / truck_volume * 100) if truck_volume > 0 else 0

    return {
        "placements": placements,
        "previous_placements": existing_placements,
        "unpacked": unpacked,
        "efficiency": round(efficiency, 1),
        "total_weight": round(total_weight, 1),
        "current_job_weight": round(current_job_weight, 1),
        "previous_jobs_weight": round(previous_jobs_weight, 1),
        "weight_capacity_used": round(total_weight / max_weight * 100, 1) if max_weight > 0 else 0,
        "truck_dimensions": {
            "length": truck_l,
            "width": truck_w,
            "height": truck_h,
        },
    }
