"""Hand-curated seed data: Python data, not Cypher.

Built to the same accuracy standard as the frontend's Phase 1 curated
dataset: every event's date/location was checked against multiple sources,
and any uncertain pairing is flagged in a comment rather than guessed.

Events are grouped by `cluster` (mirroring the frontend's Phase 1
`CuratedDateEntry` groupings) so `seed.py` can connect :CONCURRENT_WITH
between every pair of events in the same cluster, regardless of how many
days apart their individual dates fall — see the memory note on this
project's schema decisions for why a fixed date-window rule doesn't work
here (the July 4, 1776 cluster spans June 28 - July 12; the Dec 1941
cluster spans exactly one day).
"""

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Location:
    id: str
    name: str
    latitude: float
    longitude: float
    # Get-or-created as a :Region node by name at seed time — not a fixed
    # enum, per this project's Region-as-node schema decision.
    region: str


@dataclass(frozen=True)
class Person:
    id: str
    name: str


@dataclass(frozen=True)
class PolityAssignment:
    """One :PART_OF edge: `location_id` belonged to `polity_id` for
    [start_date, end_date]. Either bound may be None: `start_date=None`
    means the relationship predates any date this dataset needs to
    resolve; `end_date=None` means it's still current."""

    location_id: str
    polity_id: str
    polity_name: str
    start_date: str | None
    end_date: str | None


@dataclass(frozen=True)
class CuratedEvent:
    id: str
    title: str
    description: str
    date_start: str
    latitude: float
    longitude: float
    location_id: str
    cluster: str
    source: str
    # Null for single-day events (date_start alone describes them).
    date_end: str | None = None
    wikipedia_url: str | None = None
    person_ids: list[str] = field(default_factory=list)


LOCATIONS: list[Location] = [
    Location("loc-philadelphia", "Philadelphia, Pennsylvania", 39.9496, -75.1503, "North America"),
    Location("loc-new-york-city", "New York City", 40.7128, -74.0060, "North America"),
    Location(
        "loc-sullivans-island",
        "Sullivan's Island, South Carolina",
        32.7765,
        -79.8398,
        "North America",
    ),
    Location("loc-plymouth-england", "Plymouth, England", 50.3755, -4.1427, "Europe"),
    Location("loc-pearl-harbor", "Pearl Harbor, Oahu, Hawaii", 21.3469, -157.9583, "North America"),
    Location("loc-kota-bharu", "Kota Bharu, Malaya", 6.1254, 102.2381, "Asia"),
    Location("loc-hong-kong", "Hong Kong", 22.3193, 114.1694, "Asia"),
    Location(
        "loc-clark-field", "Clark Field, Luzon, Philippines", 15.1855, 120.5606, "Asia"
    ),
    Location("loc-guam", "Guam", 13.4443, 144.7937, "Oceania"),
    Location("loc-banes-cuba", "Banes, Cuba", 20.9631, -75.7181, "North America"),
    Location("loc-washington-dc", "Washington, D.C.", 38.8977, -77.0365, "North America"),
    Location("loc-moscow", "Moscow, USSR", 55.7558, 37.6173, "Europe"),
    Location(
        "loc-walong", "Walong, North-East Frontier Agency, India", 28.1465, 96.9528, "Asia"
    ),
]

PEOPLE: list[Person] = [
    Person("person-jefferson", "Thomas Jefferson"),
    Person("person-washington", "George Washington"),
    Person("person-moultrie", "William Moultrie"),
    Person("person-cook", "James Cook"),
    Person("person-anderson", "Rudolf Anderson"),
    Person("person-kennedy", "John F. Kennedy"),
    Person("person-khrushchev", "Nikita Khrushchev"),
]

# Only one or two real examples are needed for Phase 2 (per project scope) —
# these demonstrate the date-ranged :PART_OF relationship, not an exhaustive
# polity history for every curated location.
POLITY_ASSIGNMENTS: list[PolityAssignment] = [
    # Pennsylvania's royal charter to William Penn was dated March 4, 1681;
    # the Declaration of Independence (July 4, 1776) is used as the moment
    # the state considered itself part of a new, independent country.
    PolityAssignment(
        "loc-philadelphia", "polity-province-of-pennsylvania", "Province of Pennsylvania",
        "1681-03-04", "1776-07-04",
    ),
    PolityAssignment(
        "loc-philadelphia", "polity-usa", "United States of America", "1776-07-04", None
    ),
    # British forces occupied Hong Kong Island on January 20, 1841 under the
    # (never-ratified) Convention of Chuenpi; the Treaty of Nanking formally
    # ceding it wasn't signed until August 29, 1842. Using the earlier,
    # de facto occupation date per multiple historical sources, flagged here
    # since the alternate date is also defensible. `start_date=None` for
    # Qing Dynasty China's rule, since Chinese administration of the area
    # long predates the Qing dynasty itself and no single "start" date is
    # meaningful for this dataset's purposes.
    PolityAssignment(
        "loc-hong-kong", "polity-qing-china", "Qing Dynasty China", None, "1841-01-20"
    ),
    PolityAssignment(
        "loc-hong-kong", "polity-british-hong-kong", "British Hong Kong", "1841-01-20", None
    ),
]

EVENTS: list[CuratedEvent] = [
    # --- Cluster: Declaration of Independence, July 1776 ---
    CuratedEvent(
        id="1776-declaration-of-independence",
        title="Declaration of Independence adopted",
        description=(
            "The Second Continental Congress formally adopts the Declaration of "
            "Independence in Philadelphia, announcing the thirteen American "
            "colonies' separation from Great Britain."
        ),
        date_start="1776-07-04",
        latitude=39.9496,
        longitude=-75.1503,
        location_id="loc-philadelphia",
        cluster="cluster-1776-declaration-of-independence",
        source="U.S. National Archives: Declaration of Independence",
        date_end=None,
        wikipedia_url="https://en.wikipedia.org/wiki/United_States_Declaration_of_Independence",
        person_ids=["person-jefferson"],
    ),
    CuratedEvent(
        id="1776-washington-reads-declaration-nyc",
        title="Declaration read to Washington's troops in New York",
        description=(
            "On George Washington's orders, the Declaration of Independence is "
            "read aloud to the Continental Army assembled in New York City, "
            "days before the British fleet arrives in force."
        ),
        date_start="1776-07-09",
        latitude=40.7128,
        longitude=-74.0060,
        location_id="loc-new-york-city",
        cluster="cluster-1776-declaration-of-independence",
        source="Mount Vernon: George Washington's Reading of the Declaration of Independence",
        date_end=None,
        person_ids=["person-washington"],
    ),
    CuratedEvent(
        id="1776-cook-third-voyage-departs",
        title="Captain Cook departs on his third voyage",
        description=(
            "James Cook sails from Plymouth aboard HMS Resolution to begin his "
            "third and final Pacific voyage, ostensibly to return the Polynesian "
            "traveler Mai (Omai) home but secretly tasked with searching for a "
            "Northwest Passage."
        ),
        date_start="1776-07-12",
        latitude=50.3755,
        longitude=-4.1427,
        location_id="loc-plymouth-england",
        cluster="cluster-1776-declaration-of-independence",
        source="Captain Cook Society: Third Pacific Voyage",
        date_end=None,
        wikipedia_url="https://en.wikipedia.org/wiki/Third_voyage_of_James_Cook",
        person_ids=["person-cook"],
    ),
    CuratedEvent(
        id="1776-battle-of-sullivans-island",
        title="British assault on Charleston repulsed",
        description=(
            "A British naval squadron attacking an unfinished palmetto-log fort "
            "on Sullivan's Island is driven off by South Carolina defenders under "
            "Colonel William Moultrie, a major early Patriot victory six days "
            "before the Declaration."
        ),
        date_start="1776-06-28",
        latitude=32.7765,
        longitude=-79.8398,
        location_id="loc-sullivans-island",
        cluster="cluster-1776-declaration-of-independence",
        source="American Battlefield Trust: Sullivan's Island",
        date_end=None,
        wikipedia_url="https://en.wikipedia.org/wiki/Battle_of_Sullivan%27s_Island",
        person_ids=["person-moultrie"],
    ),
    # --- Cluster: Opening of the Pacific War, December 1941 ---
    CuratedEvent(
        id="1941-pearl-harbor",
        title="Attack on Pearl Harbor",
        description=(
            "Imperial Japanese Navy aircraft strike the U.S. Pacific Fleet at "
            "anchor in Pearl Harbor, sinking or damaging 21 ships and killing "
            "over 2,400 American service members, bringing the United States "
            "into World War II."
        ),
        date_start="1941-12-07",
        latitude=21.3469,
        longitude=-157.9583,
        location_id="loc-pearl-harbor",
        cluster="cluster-1941-pacific-war-opening",
        source="Britannica: Attack on Pearl Harbor",
        date_end=None,
        wikipedia_url="https://en.wikipedia.org/wiki/Attack_on_Pearl_Harbor",
    ),
    CuratedEvent(
        id="1941-kota-bharu-landing",
        title="Japanese landings at Kota Bharu, Malaya",
        description=(
            "About 40 minutes before the Pearl Harbor attack (but already the "
            "next calendar day locally, across the International Date Line), "
            "Japanese forces land on the northeastern coast of Malaya, opening "
            "the invasion of British Malaya."
        ),
        date_start="1941-12-08",
        latitude=6.1254,
        longitude=102.2381,
        location_id="loc-kota-bharu",
        cluster="cluster-1941-pacific-war-opening",
        source="Australian War Memorial: Invasion of Malaya",
        date_end=None,
        wikipedia_url="https://en.wikipedia.org/wiki/Battle_of_Kota_Bharu",
    ),
    CuratedEvent(
        id="1941-attack-on-hong-kong",
        title="Japanese attack on Hong Kong",
        description=(
            "Japanese troops cross the border from Guangdong into the New "
            "Territories and Japanese aircraft bomb Kai Tak Airfield, opening "
            "the eighteen-day Battle of Hong Kong."
        ),
        date_start="1941-12-08",
        latitude=22.3193,
        longitude=114.1694,
        location_id="loc-hong-kong",
        cluster="cluster-1941-pacific-war-opening",
        source="Juno Beach Centre: The Battle of Hong Kong",
        date_end=None,
        wikipedia_url="https://en.wikipedia.org/wiki/Battle_of_Hong_Kong",
    ),
    CuratedEvent(
        id="1941-attack-on-clark-field",
        title="Japanese air raid on Clark Field, Philippines",
        description=(
            "Japanese bombers and fighters destroy much of the U.S. Far East "
            "Air Force on the ground at Clark Field on Luzon, crippling "
            "American air power in the Philippines just hours after word of "
            "Pearl Harbor arrived."
        ),
        date_start="1941-12-08",
        latitude=15.1855,
        longitude=120.5606,
        location_id="loc-clark-field",
        cluster="cluster-1941-pacific-war-opening",
        source="Air & Space Forces Magazine: Disaster in the Philippines",
        date_end=None,
        wikipedia_url="https://en.wikipedia.org/wiki/Attack_on_Clark_Field",
    ),
    CuratedEvent(
        id="1941-attack-on-guam",
        title="Japanese air and naval attack on Guam",
        description=(
            "Japanese aircraft and warships attack the lightly defended American "
            "territory of Guam, beginning the invasion that would force its "
            "small garrison to surrender within two days."
        ),
        date_start="1941-12-08",
        latitude=13.4443,
        longitude=144.7937,
        location_id="loc-guam",
        cluster="cluster-1941-pacific-war-opening",
        source="Naval History and Heritage Command: Philippines, Guam, and Wake Attacks",
        date_end=None,
        wikipedia_url="https://en.wikipedia.org/wiki/Battle_of_Guam_(1941)",
    ),
    # --- Cluster: Black Saturday, October 27 1962 ---
    CuratedEvent(
        id="1962-u2-shootdown-cuba",
        title="U-2 spy plane shot down over Cuba",
        description=(
            "A Soviet-supplied SA-2 surface-to-air missile shoots down a U.S. "
            "U-2 reconnaissance aircraft over eastern Cuba, killing pilot Major "
            "Rudolf Anderson — the only combat death of the Cuban Missile "
            "Crisis and the moment U.S. and Soviet leaders later described as "
            "the closest the crisis came to war."
        ),
        date_start="1962-10-27",
        latitude=20.9631,
        longitude=-75.7181,
        location_id="loc-banes-cuba",
        cluster="cluster-1962-black-saturday",
        source="JFK Presidential Library: October 27, 1962",
        date_end=None,
        wikipedia_url="https://en.wikipedia.org/wiki/Rudolf_Anderson",
        person_ids=["person-anderson"],
    ),
    CuratedEvent(
        id="1962-excomm-deliberations",
        title="ExComm weighs retaliation in Washington",
        description=(
            "President Kennedy's Executive Committee of the National Security "
            "Council meets in Washington to debate how to respond to the U-2's "
            "downing, ultimately choosing to hold off on immediate military "
            "retaliation while back-channel diplomacy continues."
        ),
        date_start="1962-10-27",
        latitude=38.8977,
        longitude=-77.0365,
        location_id="loc-washington-dc",
        cluster="cluster-1962-black-saturday",
        source="JFK Presidential Library: October 27, 1962",
        date_end=None,
        wikipedia_url="https://en.wikipedia.org/wiki/EXCOMM",
        person_ids=["person-kennedy"],
    ),
    CuratedEvent(
        id="1962-khrushchev-second-letter",
        title="Khrushchev sends a tougher public letter",
        description=(
            "Moscow broadcasts a new, harder-line message from Soviet Premier "
            "Nikita Khrushchev demanding the removal of U.S. Jupiter missiles "
            "from Turkey in exchange for withdrawing Soviet missiles from Cuba, "
            "complicating the private negotiations already underway."
        ),
        date_start="1962-10-27",
        latitude=55.7558,
        longitude=37.6173,
        location_id="loc-moscow",
        cluster="cluster-1962-black-saturday",
        source="JFK Presidential Library: October 27, 1962",
        date_end=None,
        person_ids=["person-khrushchev"],
    ),
    CuratedEvent(
        id="1962-battle-of-walong",
        title="Fighting continues in the Battle of Walong",
        description=(
            "On the Sino-Indian War's eastern front, Chinese and Indian forces "
            "remain locked in combat in the high Himalayas near Walong — a war "
            "that erupted one week earlier and, by coincidence, was unfolding "
            "at the same time as the Cuban Missile Crisis on the opposite side "
            "of the globe."
        ),
        date_start="1962-10-27",
        latitude=28.1465,
        longitude=96.9528,
        location_id="loc-walong",
        cluster="cluster-1962-black-saturday",
        source="History Guild: Combat in the High Himalayas, the Sino-Indian War of 1962",
        date_end=None,
        wikipedia_url="https://en.wikipedia.org/wiki/Battle_of_Walong",
    ),
]
