import type { CuratedDateEntry } from '../api/types'

/**
 * Phase 1 curated historical dataset.
 *
 * Each entry groups events that are genuinely concurrent (same calendar date,
 * or within a few days where noted) across multiple regions of the world, to
 * make the "meanwhile, elsewhere" concept visible on the map. Facts below
 * were verified against multiple sources; anything uncertain is flagged
 * inline rather than guessed.
 */
export const curatedDates: CuratedDateEntry[] = [
  {
    isoDate: '1776-07-04',
    label: 'Declaration of Independence',
    events: [
      {
        id: '1776-declaration-of-independence',
        title: 'Declaration of Independence adopted',
        description:
          'The Second Continental Congress formally adopts the Declaration of Independence in Philadelphia, announcing the thirteen American colonies’ separation from Great Britain.',
        isoDate: '1776-07-04',
        latitude: 39.9496,
        longitude: -75.1503,
        region: 'North America',
        location: 'Philadelphia, Pennsylvania',
      },
      {
        id: '1776-washington-reads-declaration-nyc',
        title: 'Declaration read to Washington’s troops in New York',
        description:
          'On George Washington’s orders, the Declaration of Independence is read aloud to the Continental Army assembled in New York City, days before the British fleet arrives in force.',
        isoDate: '1776-07-09',
        latitude: 40.7128,
        longitude: -74.006,
        region: 'North America',
        location: 'New York City',
      },
      {
        id: '1776-cook-third-voyage-departs',
        title: 'Captain Cook departs on his third voyage',
        description:
          'James Cook sails from Plymouth aboard HMS Resolution to begin his third and final Pacific voyage, ostensibly to return the Polynesian traveler Mai (Omai) home but secretly tasked with searching for a Northwest Passage. (Note: this is 8 days after July 4, not same-day — included as the closest well-documented globally significant event in that window, since same-day non-American events on July 4, 1776 itself are thin in the historical record.)',
        isoDate: '1776-07-12',
        latitude: 50.3755,
        longitude: -4.1427,
        region: 'Europe',
        location: 'Plymouth, England',
      },
      {
        id: '1776-battle-of-sullivans-island',
        title: 'British assault on Charleston repulsed',
        description:
          'A British naval squadron attacking an unfinished palmetto-log fort on Sullivan’s Island is driven off by South Carolina defenders under Colonel William Moultrie, a major early Patriot victory six days before the Declaration. (Six days before July 4, not same-day — included because the British fleet lingered off Charleston for weeks afterward, so the southern colonies were still a live front around Independence Day itself.)',
        isoDate: '1776-06-28',
        latitude: 32.7765,
        longitude: -79.8398,
        region: 'North America',
        location: 'Sullivan’s Island, South Carolina',
      },
    ],
  },
  {
    isoDate: '1941-12-07',
    label: 'Opening of the Pacific War',
    events: [
      {
        id: '1941-pearl-harbor',
        title: 'Attack on Pearl Harbor',
        description:
          'Imperial Japanese Navy aircraft strike the U.S. Pacific Fleet at anchor in Pearl Harbor, sinking or damaging 21 ships and killing over 2,400 American service members, bringing the United States into World War II.',
        isoDate: '1941-12-07',
        latitude: 21.3469,
        longitude: -157.9583,
        region: 'North America',
        location: 'Pearl Harbor, Oahu, Hawaii',
      },
      {
        id: '1941-kota-bharu-landing',
        title: 'Japanese landings at Kota Bharu, Malaya',
        description:
          'About 40 minutes before the Pearl Harbor attack (but already the next calendar day locally, across the International Date Line), Japanese forces land on the northeastern coast of Malaya, opening the invasion of British Malaya.',
        isoDate: '1941-12-08',
        latitude: 6.1254,
        longitude: 102.2381,
        region: 'Asia',
        location: 'Kota Bharu, Malaya',
      },
      {
        id: '1941-attack-on-hong-kong',
        title: 'Japanese attack on Hong Kong',
        description:
          'Japanese troops cross the border from Guangdong into the New Territories and Japanese aircraft bomb Kai Tak Airfield, opening the eighteen-day Battle of Hong Kong.',
        isoDate: '1941-12-08',
        latitude: 22.3193,
        longitude: 114.1694,
        region: 'Asia',
        location: 'Hong Kong',
      },
      {
        id: '1941-attack-on-clark-field',
        title: 'Japanese air raid on Clark Field, Philippines',
        description:
          'Japanese bombers and fighters destroy much of the U.S. Far East Air Force on the ground at Clark Field on Luzon, crippling American air power in the Philippines just hours after word of Pearl Harbor arrived.',
        isoDate: '1941-12-08',
        latitude: 15.1855,
        longitude: 120.5606,
        region: 'Asia',
        location: 'Clark Field, Luzon, Philippines',
      },
      {
        id: '1941-attack-on-guam',
        title: 'Japanese air and naval attack on Guam',
        description:
          'Japanese aircraft and warships attack the lightly defended American territory of Guam, beginning the invasion that would force its small garrison to surrender within two days.',
        isoDate: '1941-12-08',
        latitude: 13.4443,
        longitude: 144.7937,
        region: 'Oceania',
        location: 'Guam',
      },
    ],
  },
  {
    isoDate: '1962-10-27',
    label: 'Black Saturday: two Cold War crises collide',
    events: [
      {
        id: '1962-u2-shootdown-cuba',
        title: 'U-2 spy plane shot down over Cuba',
        description:
          'A Soviet-supplied SA-2 surface-to-air missile shoots down a U.S. U-2 reconnaissance aircraft over eastern Cuba, killing pilot Major Rudolf Anderson — the only combat death of the Cuban Missile Crisis and the moment U.S. and Soviet leaders later described as the closest the crisis came to war.',
        isoDate: '1962-10-27',
        latitude: 20.9631,
        longitude: -75.7181,
        region: 'North America',
        location: 'Banes, Cuba',
      },
      {
        id: '1962-excomm-deliberations',
        title: 'ExComm weighs retaliation in Washington',
        description:
          'President Kennedy’s Executive Committee of the National Security Council meets in Washington to debate how to respond to the U-2’s downing, ultimately choosing to hold off on immediate military retaliation while back-channel diplomacy continues.',
        isoDate: '1962-10-27',
        latitude: 38.8977,
        longitude: -77.0365,
        region: 'North America',
        location: 'Washington, D.C.',
      },
      {
        id: '1962-khrushchev-second-letter',
        title: 'Khrushchev sends a tougher public letter',
        description:
          'Moscow broadcasts a new, harder-line message from Soviet Premier Nikita Khrushchev demanding the removal of U.S. Jupiter missiles from Turkey in exchange for withdrawing Soviet missiles from Cuba, complicating the private negotiations already underway.',
        isoDate: '1962-10-27',
        latitude: 55.7558,
        longitude: 37.6173,
        region: 'Europe',
        location: 'Moscow, USSR',
      },
      {
        id: '1962-battle-of-walong',
        title: 'Fighting continues in the Battle of Walong',
        description:
          'On the Sino-Indian War’s eastern front, Chinese and Indian forces remain locked in combat in the high Himalayas near Walong — a war that erupted one week earlier and, by coincidence, was unfolding at the same time as the Cuban Missile Crisis on the opposite side of the globe.',
        isoDate: '1962-10-27',
        latitude: 28.1465,
        longitude: 96.9528,
        region: 'Asia',
        location: 'Walong, North-East Frontier Agency, India',
      },
    ],
  },
]
