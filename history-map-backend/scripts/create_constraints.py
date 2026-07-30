"""One-time setup: create uniqueness constraints for every node's `id` property.

Idempotent via Cypher's `IF NOT EXISTS` — safe to re-run.

Usage: uv run python -m scripts.create_constraints
"""

from app.db.neo4j_driver import close_driver, get_driver

# (constraint name, node label) — one uniqueness constraint per node type.
CONSTRAINTS: list[tuple[str, str]] = [
    ("event_id_unique", "Event"),
    ("location_id_unique", "Location"),
    ("polity_id_unique", "Polity"),
    ("person_id_unique", "Person"),
    ("region_id_unique", "Region"),
]


def create_constraints() -> None:
    driver = get_driver()
    with driver.session() as session:
        for constraint_name, label in CONSTRAINTS:
            session.run(
                f"CREATE CONSTRAINT {constraint_name} IF NOT EXISTS "
                f"FOR (n:{label}) REQUIRE n.id IS UNIQUE"
            )
            print(f"Ensured constraint {constraint_name} on :{label}(id)")


def main() -> None:
    create_constraints()
    close_driver()


if __name__ == "__main__":
    main()
