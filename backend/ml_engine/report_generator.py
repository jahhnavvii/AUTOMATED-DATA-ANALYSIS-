import os, json
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable


def generate_report(project_id: str, report_data: dict):
    os.makedirs("./reports", exist_ok=True)

    # Save JSON
    with open(f"./reports/{project_id}_report.json", "w") as f:
        json.dump(report_data, f, indent=2)

    # Build PDF
    pdf_path = f"./reports/{project_id}_report.pdf"
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=60, leftMargin=60, topMargin=60, bottomMargin=60)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('title', parent=styles['Title'], textColor=colors.HexColor('#1A237E'), fontSize=24)
    h2_style = ParagraphStyle('h2', parent=styles['Heading2'], textColor=colors.HexColor('#0D47A1'), fontSize=14)
    h3_style = ParagraphStyle('h3', parent=styles['Heading3'], textColor=colors.HexColor('#1565C0'), fontSize=12)
    normal = styles['Normal']

    story = []
    story.append(Paragraph("AutoDS — Data Science Report", title_style))
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", color=colors.HexColor('#1A73E8')))
    story.append(Spacer(1, 12))

    # Executive Narrative
    narrative = report_data.get("narrative", "")
    if narrative:
        story.append(Paragraph("Executive Summary", h2_style))
        for para in narrative.split('\n'):
            if para.strip():
                story.append(Paragraph(para.strip(), normal))
                story.append(Spacer(1, 6))
        story.append(Spacer(1, 10))

    # Dataset summary
    story.append(Paragraph("Dataset Summary", h2_style))
    ds = report_data.get("dataset", {})
    story.append(Paragraph(f"Rows: {ds.get('rows')} | Columns: {ds.get('cols')} | Task: {report_data.get('task')}", normal))
    story.append(Paragraph(f"Target Column: {report_data.get('target_column', 'N/A')} | Problem Type: {report_data.get('problem_type', 'N/A')}", normal))
    story.append(Spacer(1, 10))

    # Model
    story.append(Paragraph("Model Selected", h2_style))
    story.append(Paragraph(f"Best Model: {report_data.get('best_model')} (Problem: {report_data.get('problem_type')})", normal))
    story.append(Spacer(1, 10))

    # --- Error Comparison: Before vs After Training ---
    story.append(Paragraph("Error Analysis — Before vs After Training", h2_style))
    baseline_metrics = report_data.get("baseline_metrics", {})
    trained_metrics = report_data.get("metrics", {})

    if baseline_metrics and trained_metrics:
        story.append(Paragraph("Baseline uses the simplest predictor (most-frequent class for classification, mean for regression). "
                                "This shows how much the trained model improves over a naive approach.", normal))
        story.append(Spacer(1, 8))

        comparison_data = [["Metric", "Baseline (Before)", "Trained Model (After)", "Improvement"]]
        for key in trained_metrics:
            baseline_val = baseline_metrics.get(key, "N/A")
            trained_val = trained_metrics[key]
            if isinstance(baseline_val, (int, float)) and isinstance(trained_val, (int, float)):
                improvement = trained_val - baseline_val
                improvement_str = f"{'+' if improvement > 0 else ''}{improvement:.4f}"
            else:
                improvement_str = "—"
            comparison_data.append([
                key.replace('_', ' ').title(),
                f"{baseline_val:.4f}" if isinstance(baseline_val, float) else str(baseline_val),
                f"{trained_val:.4f}" if isinstance(trained_val, float) else str(trained_val),
                improvement_str
            ])

        t = Table(comparison_data, colWidths=[120, 120, 130, 100])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1A237E')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#F8F9FA'), colors.white]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CCCCCC')),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(t)
    story.append(Spacer(1, 14))

    # --- Overfitting Analysis: Train vs Test ---
    story.append(Paragraph("Overfitting Analysis — Train vs Test Performance", h2_style))
    train_metrics = report_data.get("train_metrics", {})

    if train_metrics and trained_metrics:
        story.append(Paragraph("If train performance is significantly higher than test performance, the model may be overfitting.", normal))
        story.append(Spacer(1, 8))

        overfit_data = [["Metric", "Train Set", "Test Set", "Gap"]]
        for key in trained_metrics:
            train_val = train_metrics.get(key, "N/A")
            test_val = trained_metrics[key]
            if isinstance(train_val, (int, float)) and isinstance(test_val, (int, float)):
                gap = abs(train_val - test_val)
                gap_str = f"{gap:.4f}"
            else:
                gap_str = "—"
            overfit_data.append([
                key.replace('_', ' ').title(),
                f"{train_val:.4f}" if isinstance(train_val, float) else str(train_val),
                f"{test_val:.4f}" if isinstance(test_val, float) else str(test_val),
                gap_str
            ])

        t2 = Table(overfit_data, colWidths=[120, 120, 120, 100])
        t2.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E7D32')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#F1F8E9'), colors.white]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CCCCCC')),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(t2)
    story.append(Spacer(1, 14))

    # Validation Metrics
    story.append(Paragraph("Validation Metrics", h2_style))
    metrics = report_data.get("metrics", {})
    table_data = [["Metric", "Value"]] + [[k, str(v)] for k, v in metrics.items()]
    t = Table(table_data, colWidths=[250, 150])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1A237E')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#F8F9FA'), colors.white]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CCCCCC')),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

    # Feature Importance
    fi = report_data.get("feature_importance", {})
    if fi:
        story.append(Paragraph("Feature Importance (Top 10)", h2_style))
        fi_data = [["Feature", "Importance"]] + [[k, f"{v:.4f}"] for k, v in list(fi.items())[:10]]
        t3 = Table(fi_data, colWidths=[250, 150])
        t3.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4527A0')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#F3E5F5'), colors.white]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CCCCCC')),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(t3)
        story.append(Spacer(1, 10))

    # All Model Scores
    all_scores = report_data.get("all_model_scores", {})
    if all_scores:
        story.append(Paragraph("Model Competition Scores", h2_style))
        scores_data = [["Model", "CV Score"]] + [[k, f"{v:.4f}"] for k, v in sorted(all_scores.items(), key=lambda x: x[1], reverse=True)]
        t4 = Table(scores_data, colWidths=[250, 150])
        t4.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E65100')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#FFF3E0'), colors.white]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CCCCCC')),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(t4)
        story.append(Spacer(1, 10))

    # Confidence
    story.append(Paragraph("Confidence Score", h2_style))
    story.append(Paragraph(f"{report_data.get('confidence_score', 0):.1f}%", normal))

    # Cleaning actions
    cleaning = report_data.get("cleaning_actions", [])
    if cleaning:
        story.append(Spacer(1, 10))
        story.append(Paragraph("Data Cleaning Actions", h2_style))
        for i, act in enumerate(cleaning, 1):
            story.append(Paragraph(f"{i}. <b>{act['action']}</b>: {act['detail']}", normal))

    doc.build(story)
    return pdf_path
