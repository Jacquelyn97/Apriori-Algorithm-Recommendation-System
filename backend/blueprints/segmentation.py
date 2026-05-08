# backend/blueprints/segmentation.py
from flask import Blueprint, render_template
from services.clustering import get_cluster_summary

bp = Blueprint("seg", __name__)

@bp.route("/")
def seg_home():
    summary_list, rfm_points, radar_datasets, migration_links = get_cluster_summary()
    migration_links = migration_links or []
    max_migration_value = max((l.get("value") or 0) for l in migration_links) or 1
    migration_links_sorted = sorted(migration_links, key=lambda x: x.get("value") or 0, reverse=True)
    return render_template(
        "segmentation.html",
        summary=summary_list,
        rfm_points=rfm_points,
        radar_datasets=radar_datasets or [],
        migration_links=migration_links_sorted,
        max_migration_value=max_migration_value,
    )