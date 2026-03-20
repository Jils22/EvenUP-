"""
Unit tests for app.services.balance_service.calculate_group_balances

We use a fake in-memory "db" (a dict of lists) so no real MongoDB needed.
"""

import pytest
from bson import ObjectId
from app.services.balance_service import calculate_group_balances


def make_oid():
    return ObjectId()


class FakeCollection:
    """Minimal MongoDB collection replacement for testing."""

    def __init__(self, docs):
        self._docs = docs

    def find(self, query):
        # Only supports single field equality: {"group_id": oid}
        results = []
        for doc in self._docs:
            match = all(doc.get(k) == v for k, v in query.items())
            if match:
                results.append(doc)
        return results


class FakeDB:
    def __init__(self, expenses, settlements):
        self._collections = {
            "expenses": FakeCollection(expenses),
            "settlements": FakeCollection(settlements),
        }

    def __getitem__(self, name):
        return self._collections[name]


# ─────────────────────────────────────────────
# Test helpers
# ─────────────────────────────────────────────

def expense(group_oid, paid_by_oid, splits: list[dict]) -> dict:
    """Build an expense document with pre-computed splits."""
    total_minor = sum(s["share_minor"] for s in splits)
    return {
        "group_id": group_oid,
        "paid_by": paid_by_oid,
        "amount_minor": total_minor,
        "splits": [{"user_id": s["user_id"], "share_minor": s["share_minor"]} for s in splits],
    }


def settlement(group_oid, from_oid, to_oid, amount_minor: int) -> dict:
    return {
        "group_id": group_oid,
        "from_user_id": from_oid,
        "to_user_id": to_oid,
        "amount_minor": amount_minor,
    }


# ─────────────────────────────────────────────
# Tests
# ─────────────────────────────────────────────

def test_single_payer_equal_split():
    """Alice pays 300 shared equally with Bob and Carol. Each owes 100."""
    gid = make_oid()
    alice, bob, carol = make_oid(), make_oid(), make_oid()

    db = FakeDB(
        expenses=[
            expense(gid, alice, [
                {"user_id": alice, "share_minor": 100},
                {"user_id": bob,   "share_minor": 100},
                {"user_id": carol, "share_minor": 100},
            ])
        ],
        settlements=[],
    )

    result = calculate_group_balances(db, gid, [alice, bob, carol])
    net = result["net"]

    # Alice paid 300, owes 100 → net +200
    assert net[str(alice)] == 200
    # Bob and Carol each owe 100
    assert net[str(bob)] == -100
    assert net[str(carol)] == -100


def test_zero_balance_when_settled():
    """Bob owes Alice 100, then pays it. Net should be 0 for both."""
    gid = make_oid()
    alice, bob = make_oid(), make_oid()

    db = FakeDB(
        expenses=[
            expense(gid, alice, [
                {"user_id": alice, "share_minor": 0},
                {"user_id": bob,   "share_minor": 100},
            ])
        ],
        settlements=[
            settlement(gid, bob, alice, 100)
        ],
    )

    result = calculate_group_balances(db, gid, [alice, bob])
    net = result["net"]

    # Alice: +100 (expense) - 100 (settlement received) = 0
    assert net[str(alice)] == 0
    # Bob: -100 (expense) + 100 (settlement paid) = 0
    assert net[str(bob)] == 0


def test_no_expenses():
    """Group with two members but no expenses → everyone at 0."""
    gid = make_oid()
    alice, bob = make_oid(), make_oid()

    db = FakeDB(expenses=[], settlements=[])
    result = calculate_group_balances(db, gid, [alice, bob])
    net = result["net"]

    assert net[str(alice)] == 0
    assert net[str(bob)] == 0


def test_transfers_minimize_transactions():
    """
    3 people: Alice pays 900 split equally.
    Expected: 1 transfer Bob→Alice 300, 1 transfer Carol→Alice 300.
    Greedy algo should produce at most 2 transfers.
    """
    gid = make_oid()
    alice, bob, carol = make_oid(), make_oid(), make_oid()

    db = FakeDB(
        expenses=[
            expense(gid, alice, [
                {"user_id": alice, "share_minor": 300},
                {"user_id": bob,   "share_minor": 300},
                {"user_id": carol, "share_minor": 300},
            ])
        ],
        settlements=[],
    )

    result = calculate_group_balances(db, gid, [alice, bob, carol])
    transfers = result["transfers"]

    assert len(transfers) <= 2
    # Both transfers should go to Alice
    alice_str = str(alice)
    assert all(t["to_user_id"] == alice_str for t in transfers)
    # Total transferred equals what is owed
    assert sum(t["amount_minor"] for t in transfers) == 600


def test_multiple_expenses_multiple_payers():
    """Alice pays 200, Bob pays 200, split equally among both."""
    gid = make_oid()
    alice, bob = make_oid(), make_oid()

    db = FakeDB(
        expenses=[
            expense(gid, alice, [
                {"user_id": alice, "share_minor": 100},
                {"user_id": bob,   "share_minor": 100},
            ]),
            expense(gid, bob, [
                {"user_id": alice, "share_minor": 100},
                {"user_id": bob,   "share_minor": 100},
            ]),
        ],
        settlements=[],
    )

    result = calculate_group_balances(db, gid, [alice, bob])
    net = result["net"]

    # Both paid 200, both owe 200 → net 0 each
    assert net[str(alice)] == 0
    assert net[str(bob)] == 0
    assert result["transfers"] == []


def test_partial_settlement():
    """Bob owes Alice 200 but only settles 100. Remaining 100 should show."""
    gid = make_oid()
    alice, bob = make_oid(), make_oid()

    db = FakeDB(
        expenses=[
            expense(gid, alice, [
                {"user_id": alice, "share_minor": 0},
                {"user_id": bob,   "share_minor": 200},
            ])
        ],
        settlements=[
            settlement(gid, bob, alice, 100)
        ],
    )

    result = calculate_group_balances(db, gid, [alice, bob])
    net = result["net"]
    transfers = result["transfers"]

    assert net[str(alice)] == 100   # still owed 100
    assert net[str(bob)] == -100    # still owes 100
    assert len(transfers) == 1
    assert transfers[0]["amount_minor"] == 100
