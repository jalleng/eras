from datetime import date

from ingestion import transform
from ingestion.wikipedia_client import WikipediaSummary


def _literal(value: str, lang: str | None = None) -> dict:
    entry = {"type": "literal", "value": value}
    if lang:
        entry["xml:lang"] = lang
    return entry


def _uri(value: str) -> dict:
    return {"type": "uri", "value": value}


WATERLOO_BINDING = {
    "item": _uri("http://www.wikidata.org/entity/Q182881"),
    "itemLabel": _literal("Battle of Waterloo", "en"),
    "itemDescription": _literal("battle of the Napoleonic Wars", "en"),
    "coord": _literal("Point(4.4 50.68)"),
    "pointInTime": _literal("1815-06-18T00:00:00Z"),
    "placeLabel": _literal("Waterloo", "en"),
    "articleTitle": _literal("Battle of Waterloo"),
}

WATERLOO_SUMMARY = WikipediaSummary(
    url="https://en.wikipedia.org/wiki/Battle_of_Waterloo",
    extract="The Battle of Waterloo was fought on 18 June 1815.",
)


class TestNormalRecord:
    def test_maps_single_point_in_time_event_with_wikipedia_summary(self):
        event = transform.transform_binding(WATERLOO_BINDING, WATERLOO_SUMMARY)

        assert event is not None
        assert event.wikidata_id == "Q182881"
        assert event.id == "wikidata-Q182881"
        assert event.title == "Battle of Waterloo"
        assert event.description == WATERLOO_SUMMARY.extract
        assert event.date_start == date(1815, 6, 18)
        assert event.date_end is None
        assert event.latitude == 50.68
        assert event.longitude == 4.4
        assert event.wikipedia_url == WATERLOO_SUMMARY.url
        assert event.source == "wikidata"
        assert event.verified is False
        assert event.location.name == "Waterloo"
        assert event.location.region == "Europe"

    def test_falls_back_to_wikidata_description_when_no_wikipedia_summary(self):
        event = transform.transform_binding(WATERLOO_BINDING, wikipedia_summary=None)

        assert event is not None
        assert event.description == "battle of the Napoleonic Wars"
        assert event.wikipedia_url is None


class TestDateHandling:
    def test_single_point_in_time_leaves_date_end_null(self):
        event = transform.transform_binding(WATERLOO_BINDING)

        assert event is not None
        assert event.date_start == date(1815, 6, 18)
        assert event.date_end is None

    def test_start_and_end_time_range_maps_both_dates(self):
        binding = dict(WATERLOO_BINDING)
        del binding["pointInTime"]
        binding["startTime"] = _literal("1815-06-16T00:00:00Z")
        binding["endTime"] = _literal("1815-06-19T00:00:00Z")

        event = transform.transform_binding(binding)

        assert event is not None
        assert event.date_start == date(1815, 6, 16)
        assert event.date_end == date(1815, 6, 19)

    def test_start_time_without_end_time_leaves_date_end_null(self):
        binding = dict(WATERLOO_BINDING)
        del binding["pointInTime"]
        binding["startTime"] = _literal("1815-06-16T00:00:00Z")

        event = transform.transform_binding(binding)

        assert event is not None
        assert event.date_start == date(1815, 6, 16)
        assert event.date_end is None

    def test_point_in_time_takes_precedence_over_start_end_time(self):
        binding = {
            **WATERLOO_BINDING,
            "startTime": _literal("1815-06-01T00:00:00Z"),
            "endTime": _literal("1815-06-30T00:00:00Z"),
        }

        event = transform.transform_binding(binding)

        assert event is not None
        assert event.date_start == date(1815, 6, 18)
        assert event.date_end is None

    def test_returns_none_when_no_date_property_is_present(self):
        binding = dict(WATERLOO_BINDING)
        del binding["pointInTime"]

        assert transform.transform_binding(binding) is None


class TestMissingOptionalFields:
    def test_missing_wikipedia_article_leaves_url_null(self):
        binding = dict(WATERLOO_BINDING)
        del binding["articleTitle"]

        assert transform.get_wikipedia_title(binding) is None
        event = transform.transform_binding(binding, wikipedia_summary=None)
        assert event is not None
        assert event.wikipedia_url is None

    def test_missing_place_label_falls_back_to_stripped_item_label(self):
        binding = dict(WATERLOO_BINDING)
        del binding["placeLabel"]

        event = transform.transform_binding(binding)

        assert event is not None
        assert event.location.name == "Waterloo"

    def test_missing_item_description_and_wikipedia_summary_gives_empty_description(self):
        binding = dict(WATERLOO_BINDING)
        del binding["itemDescription"]

        event = transform.transform_binding(binding, wikipedia_summary=None)

        assert event is not None
        assert event.description == ""

    def test_polity_and_person_are_never_set_by_this_pipeline(self):
        # transform.py intentionally has no polity/person resolution -- this
        # pipeline leaves Polity/PART_OF and Person unset rather than
        # guessing when not clearly resolvable from Wikidata alone.
        event = transform.transform_binding(WATERLOO_BINDING)

        assert event is not None
        assert not hasattr(event, "polity_id")
        assert not hasattr(event, "person_ids")


class TestMalformedSparqlShapes:
    def test_returns_none_when_item_key_is_missing(self):
        binding = dict(WATERLOO_BINDING)
        del binding["item"]

        assert transform.transform_binding(binding) is None

    def test_returns_none_when_item_is_not_a_wikidata_entity_uri(self):
        binding = {**WATERLOO_BINDING, "item": _uri("http://www.wikidata.org/prop/direct/P625")}

        assert transform.transform_binding(binding) is None

    def test_returns_none_when_item_value_is_not_a_string(self):
        binding = {**WATERLOO_BINDING, "item": {"type": "uri", "value": 12345}}

        assert transform.transform_binding(binding) is None

    def test_returns_none_when_coord_is_missing(self):
        binding = dict(WATERLOO_BINDING)
        del binding["coord"]

        assert transform.transform_binding(binding) is None

    def test_returns_none_when_coord_is_unparseable(self):
        binding = {**WATERLOO_BINDING, "coord": _literal("not a point")}

        assert transform.transform_binding(binding) is None

    def test_returns_none_when_binding_value_entries_are_not_dicts(self):
        binding = {**WATERLOO_BINDING, "coord": "Point(4.4 50.68)"}

        assert transform.transform_binding(binding) is None

    def test_handles_completely_empty_binding(self):
        assert transform.transform_binding({}) is None

    def test_handles_binding_with_unexpected_extra_keys(self):
        binding = {**WATERLOO_BINDING, "somethingUnexpected": {"type": "literal", "value": "x"}}

        event = transform.transform_binding(binding)

        assert event is not None
        assert event.wikidata_id == "Q182881"


class TestIdempotency:
    def test_transforming_the_same_binding_twice_produces_identical_output(self):
        first = transform.transform_binding(WATERLOO_BINDING, WATERLOO_SUMMARY)
        second = transform.transform_binding(WATERLOO_BINDING, WATERLOO_SUMMARY)

        assert first == second
        assert first.wikidata_id == second.wikidata_id

    def test_transforming_the_same_binding_twice_without_summary_is_still_identical(self):
        first = transform.transform_binding(WATERLOO_BINDING)
        second = transform.transform_binding(WATERLOO_BINDING)

        assert first == second
