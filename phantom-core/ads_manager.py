from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from enum import StrEnum


CENT = Decimal("0.01")


def money(value: Decimal | str | int | float) -> Decimal:
    return Decimal(str(value)).quantize(CENT, rounding=ROUND_HALF_UP)


class CampaignStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"


@dataclass(frozen=True)
class FeePlan:
    """Phantom revenue rules; ad-platform media spend remains separately attributable."""

    monthly_management_fee: Decimal = Decimal("499.00")
    spend_percentage: Decimal = Decimal("0.15")
    performance_percentage: Decimal = Decimal("0.00")

    def management_fee(self) -> Decimal:
        return money(self.monthly_management_fee)

    def spend_fee(self, media_spend: Decimal) -> Decimal:
        return money(media_spend * self.spend_percentage)

    def performance_fee(self, attributed_revenue: Decimal) -> Decimal:
        return money(attributed_revenue * self.performance_percentage)


@dataclass
class Campaign:
    campaign_id: str
    client_id: str
    name: str
    platform: str
    monthly_media_budget: Decimal
    fee_plan: FeePlan
    status: CampaignStatus = CampaignStatus.DRAFT
    media_spend: Decimal = Decimal("0")
    attributed_revenue: Decimal = Decimal("0")

    def __post_init__(self) -> None:
        self.monthly_media_budget = money(self.monthly_media_budget)
        self.media_spend = money(self.media_spend)
        self.attributed_revenue = money(self.attributed_revenue)
        if self.monthly_media_budget < 0:
            raise ValueError("monthly_media_budget cannot be negative")
        if not self.campaign_id or not self.client_id or not self.name or not self.platform:
            raise ValueError("campaign_id, client_id, name, and platform are required")
        if not (Decimal("0") <= self.fee_plan.spend_percentage <= Decimal("1")):
            raise ValueError("spend_percentage must be between 0 and 1")
        if not (Decimal("0") <= self.fee_plan.performance_percentage <= Decimal("1")):
            raise ValueError("performance_percentage must be between 0 and 1")

    @property
    def remaining_budget(self) -> Decimal:
        return money(max(Decimal("0"), self.monthly_media_budget - self.media_spend))

    @property
    def phantom_revenue(self) -> Decimal:
        return money(
            self.fee_plan.management_fee()
            + self.fee_plan.spend_fee(self.media_spend)
            + self.fee_plan.performance_fee(self.attributed_revenue)
        )

    @property
    def client_total_obligation(self) -> Decimal:
        """Media spend plus Phantom's disclosed service fees."""
        return money(self.media_spend + self.phantom_revenue)

    def record_spend(self, amount: Decimal | str | int | float) -> None:
        amount = money(amount)
        if amount < 0:
            raise ValueError("spend cannot be negative")
        if self.media_spend + amount > self.monthly_media_budget:
            raise ValueError("media spend exceeds campaign budget")
        self.media_spend = money(self.media_spend + amount)

    def record_attributed_revenue(self, amount: Decimal | str | int | float) -> None:
        amount = money(amount)
        if amount < 0:
            raise ValueError("attributed revenue cannot be negative")
        self.attributed_revenue = money(self.attributed_revenue + amount)

    def activate(self) -> None:
        if self.monthly_media_budget <= 0:
            raise ValueError("campaign requires a positive media budget")
        self.status = CampaignStatus.ACTIVE

    def pause(self) -> None:
        self.status = CampaignStatus.PAUSED

    def complete(self) -> None:
        self.status = CampaignStatus.COMPLETED

    def financial_snapshot(self) -> dict[str, str]:
        return {
            "campaign_id": self.campaign_id,
            "client_id": self.client_id,
            "media_spend": str(self.media_spend),
            "remaining_media_budget": str(self.remaining_budget),
            "management_fee": str(self.fee_plan.management_fee()),
            "spend_fee": str(self.fee_plan.spend_fee(self.media_spend)),
            "performance_fee": str(self.fee_plan.performance_fee(self.attributed_revenue)),
            "phantom_revenue": str(self.phantom_revenue),
            "client_total_obligation": str(self.client_total_obligation),
        }
