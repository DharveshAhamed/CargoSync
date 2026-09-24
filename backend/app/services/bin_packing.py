"""
CargoSync — 3D Bin Packing Algorithm
Uses First Fit Decreasing Height (FFDH) with reverse delivery sequencing.

Boxes loaded LAST are delivered FIRST (reverse delivery order).
Fragile items are always placed on top.
"""

from typing import List, Dict


def pack_boxes_3d(truck: Dict, boxes: List[Dict]) -> Dict:
    """
    3D bin packing algorithm with reverse delivery sequencing.

    Args:
        truck: {"length": cm, "width": cm, "height": cm, "max_weight": kg}
        boxes: [{"id", "label", "length", "width", "height", "weight", "stop_order", "fragile"}]

    Returns:
        {
            "placements": [{"id", "label", "x", "y", "z", "rotation", "stop_order"}],
            "unpacked": [{"id", "label", "reason"}],
            "efficiency": float (0-100),
            "total_weight": float,
            "weight_capacity_used": float
        }
    """
    truck_l = truck["length"]
    truck_w = truck["width"]
    truck_h = truck["height"]
    max_weight = truck["max_weight"]

    # Sort boxes: highest stop_order first (reverse delivery = loaded first at back)
    # Then by volume (largest first) for better space utilization
    # Fragile items sorted to be placed last (on top)
    sorted_boxes = sorted(
        boxes,
        key=lambda b: (
            b.get("fragile", False),     # Non-fragile first (placed at bottom)
            -b.get("stop_order", 1),      # Highest stop_order first (last delivered = loaded first)
            -(b["length"] * b["width"] * b["height"]),  # Largest volume first
        ),
    )

    placements = []
    unpacked = []
    total_weight = 0.0

    # Track occupied spaces using a simple shelf-based approach
    # Each shelf is a layer at a certain height
    shelves = []  # [(y_start, y_height, occupied_rects)]

    def find_position(box_l, box_w, box_h, box_weight):
        """Find a valid position for a box using shelf-based packing."""
        nonlocal total_weight

        # Check weight
        if total_weight + box_weight > max_weight:
            return None

        # Try each existing shelf
        for i, (shelf_y, shelf_h, occupied) in enumerate(shelves):
            if box_h <= shelf_h and shelf_y + box_h <= truck_h:
                # Try to find space in this shelf
                pos = find_space_in_shelf(box_l, box_w, occupied)
                if pos:
                    x, z = pos
                    occupied.append((x, z, box_l, box_w))
                    total_weight += box_weight
                    return (x, shelf_y, z)

        # Create a new shelf
        new_y = sum(sh for _, sh, _ in shelves) if shelves else 0
        if new_y + box_h <= truck_h:
            new_shelf = (new_y, box_h, [(0, 0, box_l, box_w)])
            shelves.append(new_shelf)
            total_weight += box_weight
            return (0, new_y, 0)

        return None

    def find_space_in_shelf(box_l, box_w, occupied):
        """Find free space in a shelf's XZ plane using simple grid search."""
        step = 5  # 5cm grid resolution for performance
        for x in range(0, int(truck_l - box_l) + 1, step):
            for z in range(0, int(truck_w - box_w) + 1, step):
                if not any(
                    rectangles_overlap(x, z, box_l, box_w, ox, oz, ol, ow)
                    for ox, oz, ol, ow in occupied
                ):
                    return (x, z)
        return None

    def rectangles_overlap(x1, z1, l1, w1, x2, z2, l2, w2):
        """Check if two rectangles overlap in XZ plane."""
        return not (
            x1 + l1 <= x2 or x2 + l2 <= x1 or
            z1 + w1 <= z2 or z2 + w2 <= z1
        )

    # Pack each box
    for box in sorted_boxes:
        dims = box["length"], box["width"], box["height"]
        # Try different orientations (6 rotations)
        orientations = [
            (dims[0], dims[1], dims[2], 0),  # Original
            (dims[1], dims[0], dims[2], 1),  # Rotated 90° on Y
            (dims[0], dims[2], dims[1], 2),  # Rotated 90° on X
            (dims[2], dims[1], dims[0], 3),  # Rotated 90° on Z
            (dims[1], dims[2], dims[0], 4),  # Rotated on XY
            (dims[2], dims[0], dims[1], 5),  # Rotated on XZ
        ]

        placed = False
        for l, w, h, rotation in orientations:
            if l > truck_l or w > truck_w or h > truck_h:
                continue

            pos = find_position(l, w, h, box["weight"])
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
                })
                placed = True
                break

        if not placed:
            unpacked.append({
                "id": box["id"],
                "label": box["label"],
                "reason": "No space available" if total_weight < max_weight else "Weight limit exceeded",
            })

    # Calculate metrics
    truck_volume = truck_l * truck_w * truck_h
    packed_volume = sum(
        p["length"] * p["width"] * p["height"]
        for p in placements
    )
    efficiency = (packed_volume / truck_volume * 100) if truck_volume > 0 else 0

    return {
        "placements": placements,
        "unpacked": unpacked,
        "efficiency": round(efficiency, 1),
        "total_weight": round(total_weight, 1),
        "weight_capacity_used": round(total_weight / max_weight * 100, 1) if max_weight > 0 else 0,
        "truck_dimensions": {
            "length": truck_l,
            "width": truck_w,
            "height": truck_h,
        },
    }
