from decimal import Decimal

import pytest

from ads_manager import Campaign, CampaignStatus, FeePlan


def test_campaign_calculates_phantom_revenue_separately_from_media_spend():
    campaign = Campaign(
        campaign_id="C-1",
        client_id="CLIENT-1",
        name="Launch",
        platform="google",
        monthly_media_budget=Decimal("2000"),
        fee_plan=FeePlan(monthly_management_fee=Decimal("500"), spend_percentage=Decimal("0.10")),
    )
    campaign.activate()
    campaign.record_spend("1200")

    assert campaign.status == CampaignStatus.ACTIVE
    assert campaign.phantom_revenue == Decimal("620.00")
    assert campaign.client_total_obligation == Decimal("1820.00")
    assert campaign.remaining_budget == Decimal("800.00")


def test_campaign_rejects_budget_overrun():
    campaign = Campaign("C-2", "CLIENT-2", "Test", "meta", Decimal("100"), FeePlan())
    with pytest.raises(ValueError, match="exceeds campaign budget"):
        campaign.record_spend("100.01")


def test_performance_fee_is_optional_and_explicit():
    campaign = Campaign(
        "C-3", "CLIENT-3", "Performance", "google", Decimal("1000"),
        FeePlan(monthly_management_fee=Decimal("0"), spend_percentage=Decimal("0"), performance_percentage=Decimal("0.05")),
    )
    campaign.record_attributed_revenue("4000")
    assert campaign.phantom_revenue == Decimal("200.00")
