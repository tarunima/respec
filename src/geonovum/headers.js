/*jshint
    forin: false
*/
/*global hb*/

// Module geonovum/headers
// Generate the headers material based on the provided configuration.
// CONFIGURATION
//  - specStatus: the short code for the specification's maturity level or type (required)
//  - shortName: the small name that is used after /TR/ in published reports (required)
//  - editors: an array of people editing the document (at least one is required). People
//      are defined using:
//          - name: the person's name (required)
//          - url: URI for the person's home page
//          - company: the person's company
//          - companyURL: the URI for the person's company
//          - mailto: the person's email
//          - note: a note on the person (e.g. former editor)
//  - authors: an array of people who are contributing authors of the document.
//  - subtitle: a subtitle for the specification
//  - publishDate: the date to use for the publication, default to document.lastModified, and
//      failing that to now. The format is YYYY-MM-DD or a Date object.
//  - previousPublishDate: the date on which the previous version was published.
//  - previousMaturity: the specStatus of the previous version
//  - errata: the URI of the errata document, if any
//  - alternateFormats: a list of alternate formats for the document, each of which being
//      defined by:
//          - uri: the URI to the alternate
//          - label: a label for the alternate
//          - lang: optional language
//          - type: optional MIME type
//  - logos: a list of logos to use instead of the W3C logo, each of which being defined by:
//          - src: the URI to the logo (target of <img src=>)
//          - alt: alternate text for the image (<img alt=>), defaults to "Logo" or "Logo 1", "Logo 2", ...
//            if src is not specified, this is the text of the "logo"
//          - height: optional height of the logo (<img height=>)
//          - width: optional width of the logo (<img width=>)
//          - url: the URI to the organization represented by the logo (target of <a href=>)
//          - id: optional id for the logo, permits custom CSS (wraps logo in <span id=>)
//          - each logo element must specifiy either src or alt
//  - testSuiteURI: the URI to the test suite, if any
//  - implementationReportURI: the URI to the implementation report, if any
//  - bugTracker: and object with the following details
//      - open: pointer to the list of open bugs
//      - new: pointer to where to raise new bugs
//  - noRecTrack: set to true if this document is not intended to be on the Recommendation track
//  - edDraftURI: the URI of the Editor's Draft for this document, if any. Required if
//      specStatus is set to "ED".
//  - additionalCopyrightHolders: a copyright owner in addition to W3C (or the only one if specStatus
//      is unofficial)
//  - overrideCopyright: provides markup to completely override the copyright
//  - copyrightStart: the year from which the copyright starts running
//  - prevED: the URI of the previous Editor's Draft if it has moved
//  - prevRecShortname: the short name of the previous Recommendation, if the name has changed
//  - prevRecURI: the URI of the previous Recommendation if not directly generated from
//    prevRecShortname.
//  - wg: the name of the WG in charge of the document. This may be an array in which case wgURI
//      and wgPatentURI need to be arrays as well, of the same length and in the same order
//  - wgURI: the URI to the group's page, or an array of such
//  - wgPatentURI: the URI to the group's patent information page, or an array of such. NOTE: this
//      is VERY IMPORTANT information to provide and get right, do not just paste this without checking
//      that you're doing it right
//  - wgPublicList: the name of the mailing list where discussion takes place. Note that this cannot
//      be an array as it is assumed that there is a single list to discuss the document, even if it
//      is handled by multiple groups
//  - charterDisclosureURI: used for IGs (when publishing IG-NOTEs) to provide a link to the IPR commitment
//      defined in their charter.
//  - addPatentNote: used to add patent-related information to the SotD, for instance if there's an open
//      PAG on the document.
//  - thisVersion: the URI to the dated current version of the specification. ONLY ever use this for CG/BG
//      documents, for all others it is autogenerated.
//  - latestVersion: the URI to the latest (undated) version of the specification. ONLY ever use this for CG/BG
//      documents, for all others it is autogenerated.
//  - prevVersion: the URI to the previous (dated) version of the specification. ONLY ever use this for CG/BG
//      documents, for all others it is autogenerated.
//  - subjectPrefix: the string that is expected to be used as a subject prefix when posting to the mailing
//      list of the group.
//  - otherLinks: an array of other links that you might want in the header (e.g., link github, twitter, etc).
//         Example of usage: [{key: "foo", href:"https://b"}, {key: "bar", href:"https://"}].
//         Allowed values are:
//          - key: the key for the <dt> (e.g., "Bug Tracker"). Required.
//          - value: The value that will appear in the <dd> (e.g., "GitHub"). Optional.
//          - href: a URL for the value (e.g., "https://foo.com/issues"). Optional.
//          - class: a string representing CSS classes. Optional.
//  - license: can be one of the following
//      - "w3c", currently the default (restrictive) license
//      - "cc-by", which is experimentally available in some groups (but likely to be phased out).
//          Note that this is a dual licensing regime.
//      - "cc0", an extremely permissive license. It is only recommended if you are working on a document that is
//          intended to be pushed to the WHATWG.
//      - "w3c-software", a permissive and attributions license (but GPL-compatible).
//      - "w3c-software-doc", the W3C Software and Document License
//            https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
import { concatDate, joinAnd, ISODate } from "core/utils";
import hb from "handlebars.runtime";
import { pub } from "core/pubsubhub";
import tmpls from "templates";

// Thijs Brentjens: customize in the geonovum/templates directory
import sotdTmpl from "geonovum/templates/sotd";
import headersTmpl from "geonovum/templates/headers";

export const name = "geonovum/headers";

const GNVMDate = new Intl.DateTimeFormat(["nl"], {
  timeZone: "UTC",
  year: "numeric",
  month: "long",
  day: "2-digit",
});

// Thijs: clean this up, for Geonovum
// added statusses and types for Geonovum
const status2maturity = {
};

// Thijs Brentjens: added Geonovum statusses
// https://github.com/Geonovum/respec/wiki/specStatus
const status2text = {
  "GN-WV": "Werkversie",
  "GN-CV": "Consultatieversie",
  "GN-VV": "Versie ter vaststelling",
  "GN-DEF": "Vastgestelde versie",
  "GN-BASIS": "Document",
};
// Thijs Brentjens: added Geonovum types
// https://github.com/Geonovum/respec/wiki/specType
const type2text = {
  NO: "Norm",
  ST: "Standaard",
  IM: "Informatiemodel",
  PR: "Praktijkrichtlijn",
  HR: "Handreiking",
  WA: "Werkafspraak",
};

const status2long = {
  // "FPWD-NOTE": "First Public Working Group Note",
  // "LC-NOTE": "Last Call Working Draft",
};

const noTrackStatus = []; // empty? or only "GN-BASIS"?
// Thijs Brentjens: default licenses for Geonovum to version 4.0
const licenses = {
  cc0: {
    name: "Creative Commons 0 Public Domain Dedication",
    short: "CC0",
    url: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  "cc-by": {
    name: "Creative Commons Attribution 4.0 International Public License",
    short: "CC-BY",
    url: "https://creativecommons.org/licenses/by/4.0/legalcode",
  },
  "cc-by-nd": {
    name: "Creative Commons Naamsvermelding-GeenAfgeleideWerken 4.0 Internationaal",
    short: "CC-BY-ND",
    url: "https://creativecommons.org/licenses/by-nd/4.0/legalcode.nl",
  },
};

function validateDateAndRecover(conf, prop, fallbackDate = new Date()) {
  const date = conf[prop] ? new Date(conf[prop]) : new Date(fallbackDate);
  // if date is valid
  if (Number.isFinite(date.valueOf())) {
    const formattedDate = ISODate.format(date);
    return new Date(formattedDate);
  }
  const msg =
    `[\`${prop}\`](https://github.com/w3c/respec/wiki/${prop}) ` +
    `is not a valid date: "${conf[prop]}". Expected format 'YYYY-MM-DD'.`;
  pub("error", msg);
  return new Date(ISODate.format(new Date()));
}

export function run(conf) {
  // Thijs Brentjens: TODO: decide by default unofficial?
  // conf.isUnofficial = conf.specStatus === "unofficial";
  conf.isUnofficial = true;
  if (!conf.logos) { // conf.isUnofficial
    conf.logos = [];
  }
  conf.specStatus = conf.specStatus ? conf.specStatus.toUpperCase() : "";
  conf.specType = conf.specType ? conf.specType.toUpperCase() : "";
  conf.pubDomain = conf.pubDomain ? conf.pubDomain.toLowerCase() : "";
  conf.hasBeenPublished = conf.publishDate ? true : false
  // Thijs Brentjens: TODO: document license types for Geonovum
  conf.isCCBY = conf.license === "cc-by";
  conf.isCCBYND = conf.license === "cc-by-nd";

  conf.licenseInfo = licenses[conf.license];
  conf.isBasic = conf.specStatus === "base";
  // Thijs Brentjens: TODO: for a GN-BASIS document, is it neceassry to deal differently with URIs? Especially for "Laatst gepubliceerde versie"
  // Deal with all current GN specStatusses the same. This is mostly seen in the links in the header for Last editor's draft etc
  // conf.isRegular = conf.specStatus !== "GN-BASIS";
  conf.isRegular = true;
  conf.isOfficial = conf.specStatus === "GN-DEF";

  if (!conf.specStatus) {
    pub("error", "Missing required configuration: `specStatus`");
  }
  if (conf.isRegular && !conf.shortName) {
    pub("error", "Missing required configuration: `shortName`");
  }
  conf.title = document.title || "No Title";
  if (!conf.subtitle) conf.subtitle = "";
  conf.publishDate = validateDateAndRecover(
    conf,
    "publishDate",
    document.lastModified
  );
  conf.publishYear = conf.publishDate.getUTCFullYear();
  conf.publishHumanDate = GNVMDate.format(conf.publishDate);
  conf.isNoTrack = noTrackStatus.includes(conf.specStatus);

  if (!conf.edDraftURI) {
    conf.edDraftURI = "";
    // Thijs Brentjens: deal with editors draft links based on Github URIs
    if (conf.github) {
      // parse the org and repo name to construct a github.io URI if a github URI is provided
      // https://github.com/Geonovum/respec/issues/141
      // https://github.com/{org}/{repo} should be rewritten to https://{org}.github.io/{repo}/
      var githubParts = conf.github.split('github.com/')[1].split('/');
      conf.edDraftURI = "https://" + githubParts[0] + ".github.io/" + githubParts[1];
    }
    if (conf.specStatus === "ED")
      pub("warn", "Editor's Drafts should set edDraftURI.");
  }
  // Version URLs
  // Thijs Brentjens: changed this to Geonovum specific format. See https://github.com/Geonovum/respec/issues/126
  if (conf.isRegular && conf.specStatus !== "GN-WV") {
    conf.thisVersion =
      "https://docs.geostandaarden.nl/" +
      conf.pubDomain +
      "/" +
      conf.specStatus.substr(3).toLowerCase() +
      "-" +
      conf.specType.toLowerCase() +
      "-" +
      conf.shortName +
      "-" +
      concatDate(conf.publishDate) +
      "/";
  } else {
    conf.thisVersion = conf.edDraftURI;
  }

  // Only show latestVersion if a publishDate has been set. see issue https://github.com/Geonovum/respec/issues/93
  if (conf.isRegular && conf.hasBeenPublished)
    // Thijs Brentjens: see
    conf.latestVersion =
      "https://docs.geostandaarden.nl/" +
      conf.pubDomain +
      "/" +
      conf.shortName +
      "/";

  // Thijs Brentjens: support previousMaturity as previousStatus
  if (conf.previousMaturity && !conf.previousStatus) conf.previousStatus = conf.previousMaturity
  // Thijs Brentjens: default to current specStatus if previousStatus is not provided
  if (conf.previousPublishDate && !conf.previousStatus) conf.previousStatus = conf.specStatus
  if (conf.previousPublishDate && conf.previousStatus) {
    conf.previousPublishDate = validateDateAndRecover(
      conf,
      "previousPublishDate"
    );
    var prevStatus = conf.previousStatus.substr(3).toLowerCase();
    // Thijs Brentjens: default to current spectype
    // TODO: should the prev-/spectype always be in the WP URL too?
    var prevType="";
    if (conf.previousType) {
      prevType = conf.previousType.toLowerCase();
    } else {
      prevType = conf.specType.toLowerCase();
    }
    conf.prevVersion = "None" + conf.previousPublishDate;
    conf.prevVersion =
      "https://docs.geostandaarden.nl/" +
      conf.pubDomain +
      "/" +
      prevStatus +
      "-" +
      prevType +
      "-" +
      conf.shortName +
      "-" +
      concatDate(conf.previousPublishDate) +
      "/";
  }

  var peopCheck = function(it) {
    if (!it.name) pub("error", "All authors and editors must have a name.");
  };
  if (conf.editors) {
    conf.editors.forEach(peopCheck);
  }
  if (conf.authors) {
    conf.authors.forEach(peopCheck);
  }
  conf.multipleEditors = conf.editors && conf.editors.length > 1;
  conf.multipleAuthors = conf.authors && conf.authors.length > 1;
  $.each(conf.alternateFormats || [], function(i, it) {
    if (!it.uri || !it.label)
      pub("error", "All alternate formats must have a uri and a label.");
  });
  conf.multipleAlternates =
    conf.alternateFormats && conf.alternateFormats.length > 1;
  conf.alternatesHTML =
    conf.alternateFormats &&
    joinAnd(conf.alternateFormats, function(alt) {
      var optional =
        alt.hasOwnProperty("lang") && alt.lang
          ? " hreflang='" + alt.lang + "'"
          : "";
      optional +=
        alt.hasOwnProperty("type") && alt.type
          ? " type='" + alt.type + "'"
          : "";
      return (
        "<a rel='alternate' href='" +
        alt.uri +
        "'" +
        optional +
        ">" +
        alt.label +
        "</a>"
      );
    });
  if (conf.bugTracker) {
    if (conf.bugTracker["new"] && conf.bugTracker.open) {
      conf.bugTrackerHTML =
        "<a href='" +
        conf.bugTracker["new"] +
        "'>" +
        conf.l10n.file_a_bug +
        "</a> " +
        conf.l10n.open_parens +
        "<a href='" +
        conf.bugTracker.open +
        "'>" +
        conf.l10n.open_bugs +
        "</a>" +
        conf.l10n.close_parens;
    } else if (conf.bugTracker.open) {
      conf.bugTrackerHTML =
        "<a href='" + conf.bugTracker.open + "'>open bugs</a>";
    } else if (conf.bugTracker["new"]) {
      conf.bugTrackerHTML =
        "<a href='" + conf.bugTracker["new"] + "'>file a bug</a>";
    }
  }
  if (conf.copyrightStart && conf.copyrightStart == conf.publishYear)
    conf.copyrightStart = "";
  for (var k in status2text) {
    if (status2long[k]) continue;
    status2long[k] = status2text[k];
  }
  conf.longStatus = status2long[conf.specStatus];
  conf.textStatus = status2text[conf.specStatus];
  // Thijs: added typeStatus
  conf.typeStatus = type2text[conf.specType];

  conf.showThisVersion = !conf.isNoTrack; // || conf.isTagFinding;
  // Thijs Brentjens: adapted for Geonovum document tyoes
  // TODO: add an extra check, because now it seems that showPreviousVersion is true in (too) many cases?
  conf.showPreviousVersion =
    !conf.isNoTrack &&
    !conf.isSubmission;
  // Thijs Brentjens: only show if prevVersion is available
  if (!conf.prevVersion)
    conf.showPreviousVersion = false;
  // Thijs: get specStatus from Geonovum list https://github.com/Geonovum/respec/wiki/specStatus
  conf.isGNDEF = conf.specStatus === "GN-DEF";
  conf.isGNWV = conf.specStatus === "GN-WV";
  conf.isGNCV = conf.specStatus === "GN-CV";
  conf.isGNVV = conf.specStatus === "GN-VV";
  conf.isGNBASIS = conf.specStatus === "GN-BASIS";

  conf.dashDate = ISODate.format(conf.publishDate);
  conf.publishISODate = conf.publishDate.toISOString();
  conf.shortISODate = ISODate.format(conf.publishDate);
  Object.defineProperty(conf, "wgId", {
    get() {
      if (!this.hasOwnProperty("wgPatentURI")) {
        return "";
      }
      // it's always at "pp-impl" + 1
      const urlParts = this.wgPatentURI.split("/");
      const pos = urlParts.findIndex(item => item === "pp-impl") + 1;
      return urlParts[pos] || "";
    },
  });
  // configuration done - yay!

  // insert into document
  const header = (headersTmpl)(conf);
  document.body.insertBefore(header, document.body.firstChild);
  document.body.classList.add("h-entry");

  // handle SotD
  var sotd =
    document.getElementById("sotd") || document.createElement("section");
  if ((!conf.isNoTrack) && !sotd.id) {
    pub(
      "error",
      "A custom SotD paragraph is required for your type of document."
    );
  }
  sotd.id = sotd.id || "stod";
  sotd.classList.add("introductory");
  // NOTE:
  //  When arrays, wg and wgURI have to be the same length (and in the same order).
  //  Technically wgURI could be longer but the rest is ignored.
  //  However wgPatentURI can be shorter. This covers the case where multiple groups
  //  publish together but some aren't used for patent policy purposes (typically this
  //  happens when one is foolish enough to do joint work with the TAG). In such cases,
  //  the groups whose patent policy applies need to be listed first, and wgPatentURI
  //  can be shorter — but it still needs to be an array.
  var wgPotentialArray = [conf.wg, conf.wgURI, conf.wgPatentURI];
  if (
    wgPotentialArray.some(item => Array.isArray(item)) &&
    !wgPotentialArray.every(item => Array.isArray(item))
  ) {
    pub(
      "error",
      "If one of '`wg`', '`wgURI`', or '`wgPatentURI`' is an array, they all have to be."
    );
  }
  if (Array.isArray(conf.wg)) {
    conf.multipleWGs = conf.wg.length > 1;
    conf.wgHTML = joinAnd(conf.wg, function(wg, idx) {
      return "the <a href='" + conf.wgURI[idx] + "'>" + wg + "</a>";
    });
    var pats = [];
    for (var i = 0, n = conf.wg.length; i < n; i++) {
      pats.push(
        "a <a href='" +
          conf.wgPatentURI[i] +
          "' rel='disclosure'>" +
          "public list of any patent disclosures  (" +
          conf.wg[i] +
          ")</a>"
      );
    }
    conf.wgPatentHTML = joinAnd(pats);
  } else {
    conf.multipleWGs = false;
    conf.wgHTML = "the <a href='" + conf.wgURI + "'>" + conf.wg + "</a>";
  }
  if (conf.specStatus === "PR" && !conf.crEnd) {
    pub(
      "error",
      `\`specStatus\` is "PR" but no \`crEnd\` is specified (needed to indicate end of previous CR).`
    );
  }

  if (conf.specStatus === "CR" && !conf.crEnd) {
    pub(
      "error",
      `\`specStatus\` is "CR", but no \`crEnd\` is specified in Respec config.`
    );
  }
  conf.crEnd = validateDateAndRecover(conf, "crEnd");
  conf.humanCREnd = GNVMDate.format(conf.crEnd);

  if (conf.specStatus === "PR" && !conf.prEnd) {
    pub("error", `\`specStatus\` is "PR" but no \`prEnd\` is specified.`);
  }
  conf.prEnd = validateDateAndRecover(conf, "prEnd");
  conf.humanPREnd = GNVMDate.format(conf.prEnd);

  if (conf.specStatus === "PER" && !conf.perEnd) {
    pub("error", "Status is PER but no perEnd is specified");
  }
  conf.perEnd = validateDateAndRecover(conf, "perEnd");
  conf.humanPEREnd = GNVMDate.format(conf.perEnd);

  if (conf.subjectPrefix !== "")
    conf.subjectPrefixEnc = encodeURIComponent(conf.subjectPrefix);

  hyperHTML.bind(sotd)`${populateSoTD(conf, sotd)}`;

  if (!conf.implementationReportURI && (conf.isCR || conf.isPR || conf.isRec)) {
    pub(
      "error",
      "CR, PR, and REC documents need to have an `implementationReportURI` defined."
    );
  }

  // Requested by https://github.com/w3c/respec/issues/504
  // Makes a record of a few auto-generated things.
  pub("amend-user-config", {
    publishISODate: conf.publishISODate,
    generatedSubtitle: `${conf.longStatus} ${conf.publishHumanDate}`,
  });
}

function populateSoTD(conf, sotd) {
  const sotdClone = sotd.cloneNode(true);
  const additionalNodes = document.createDocumentFragment();
  const additionalContent = document.createElement("temp");
  // we collect everything until we hit a section,
  // that becomes the custom content.
  while (sotdClone.hasChildNodes()) {
    if (
      sotdClone.firstChild.nodeType !== Node.ELEMENT_NODE ||
      sotdClone.firstChild.localName !== "section"
    ) {
      additionalNodes.appendChild(sotdClone.firstChild);
      continue;
    }
    break;
  }
  additionalContent.appendChild(additionalNodes);
  conf.additionalContent = additionalContent.innerHTML;
  // Whatever sections are left, we throw at the end.
  conf.additionalSections = sotdClone.innerHTML;
  return (sotdTmpl)(conf);
}
