'use strict';

const mml = require('mathml');
const cytoscape = require('cytoscape');
const popper = require('cytoscape-popper');
const tippy = require('tippy.js');
const cxtmenu = require('cytoscape-cxtmenu');
const base = require('xtraverse/lib/collection.js');
const _ = require('lodash');

// See https://github.com/cytoscape/cytoscape.js-dagre/issues/62
if (typeof (window) !== 'undefined') {
  const dagre = require('cytoscape-dagre');
  cytoscape.use(dagre);
}

cytoscape.use(popper);
cytoscape.use(cxtmenu);

function layout(cy) {
  if (!cy.headless()) {
    cy.elements().filter(e => e.visible()).layout({
      name: 'dagre',
      fit: true
    }).run();
  }

}

function addNode(elements, n) {
  elements.push({
    group: 'nodes',
    data: n,
    classes: 'top-center'
  });
}

function addEdge(elements, child, parent) {
  elements.push({
    group: 'edges',
    data: {
      id: `${parent.id}-${child.id}`,
      source: parent.id,
      target: child.id
    },
    classes: 'hierarchy'
  });
}


mml.base.prototype.toCytoscape = function(options = {}, elements = []) {
  const defaults = {
    exScalingFactor: 12,
    minNodeSize: 30,
  };
  let applyForm = false;

  function isApply(n) {
    return n.data() && n.data().name() === 'apply';
  }

  function isCs(n) {
    return n.data() && n.data().name() === 'cs';
  }

  function isCsymbol(n) {
    return n.data() && n.data().name() === 'csymbol';
  }

  function getFirstChild(a) {
    const firstX = a.data().children().first();
    if (firstX.length) {
      return a.cy().getElementById(firstX.id);
    } else {
      return false;
    }
  }

  function setDim(n, xSvg, what) {
    const oldLength = n.style(what);
    n.style(what, xSvg.attr(what));
    const eff = Math.max(n.numericStyle(what) * defaults.exScalingFactor, defaults.minNodeSize);
    n.style(what, eff);
    // log(`set dimension ${what} to ${xSvg.attr(what)} (${eff}px)`);
    return eff > oldLength;
  }

  function setBackground(n) {
    const imgUrl = n.data().imgUrl();
    n.style('background-image', imgUrl);
    // while one could use isomorphic fetch, one does not need the svg dimensions in a headless environment
    if (typeof fetch !== "undefined") {
      // eslint-disable-next-line no-undef
      fetch(imgUrl).then((res) => {
        res.text()
          .then((t) => {
            const xSvg = mml(t);
            setDim(n, xSvg, 'width');
            setDim(n, xSvg, 'height');
          });
      });
    }

  }

  function setApplyForm(a) {
    a.data().expansion = 'first';
    a.style('background-image', a.data().imgUrl());
    getFirstChild(a).hide();
  }

  if (options.applyForm) {
    applyForm = options.applyForm;
    delete options.applyForm;
  }

  this._addCTreeElements(elements, addNode, addEdge);
  Object.assign(options, { elements });
  const cy = cytoscape(options);

  cy.startBatch();
  const applyNodes = cy.nodes().filter(isApply);

  function redraw() {
    cy.nodes().map(setBackground);
    applyNodes.forEach((a) => {
      const firstCy = getFirstChild(a);
      if (firstCy && firstCy.data().children().length === 0) {
        firstCy.on('click', (e) => {
          setApplyForm(a);
        });
        if (applyForm) {
          setApplyForm(a);
        }
      }
    });
  }

  if (!cy.headless()) {
    const csNodes = cy.nodes().filter(isCs);
    csNodes.forEach((n) => {
      const ref = n.popperRef(); // used only for positioning
      const cs = n.data()[0].textContent;
      const t = tippy(ref, {
        // eslint-disable-next-line no-undef
        content: document.querySelector('#tooltipTemplate'),
        onShow(tip) {
          tip.setContent(cs);
        }
      }).instances[0];
      n.on('mouseover', () => t.show());
      n.on('mouseout', () => t.hide());

    });
    const csymbolNodes = cy.nodes().filter(isCsymbol);
    csymbolNodes.forEach((n) => {
      const ref = n.popperRef(); // used only for positioning
      const symbol = n.data()[0].textContent;
      const cd = 'wikidata';
      const t = tippy(ref, {
        // eslint-disable-next-line no-undef
        content: document.querySelector('#tooltipTemplate'),
        onShow(tip) {
          tip.setContent(`Fetching information for symbol ${symbol} from content directory ${cd}.`);
          if (typeof fetch !== "undefined") {
            if (cd === 'wikidata') {
              // eslint-disable-next-line no-undef
              fetch(`http://www.wikidata.org/wiki/Special:EntityData/${symbol}.json`).then((res) => {
                res.json()
                  .then((json) => {
                    // language=HTML
                    tip.setContent(
                      `<h3><a href="https://wikidata.org/wiki/${symbol}" target="_blank">
Wikidata ${symbol}</a></h3><p> ${_.get(json, `entities[${symbol}].labels.en.value`, symbol)} </p>
<p>${_.get(json, `entities[${symbol}].descriptions.en.value`, 'no description')} </p>`);
                  });
              })
                .catch((e) => {
                  console.error(e);
                  tip.setContent('Loading failed');
                });
            }
          }

        }
      }).instances[0];
      n.on('mouseover', () => t.show());
      n.on('mouseout', () => t.hide());
    });
  }


  applyNodes.on('click', (e) => {
    cy.startBatch();
    const n = e.target;
    const expansion = n.data().expansion;
    if (expansion === 'collapsed') {
      n.data().expansion = false;
      const nodesToShow = n.successors(node => node.hidden());
      nodesToShow.data('expansion', false);
      nodesToShow.show();
      layout(cy);
    } else {
      n.data().expansion = 'collapsed';
      const nodesToHide = n.successors(node => node.visible());
      nodesToHide.hide();
    }
    setBackground(n);
    cy.endBatch();
  });
  // applyNodes.on('mouseover', onMouseOver);
  redraw();
  layout(cy);
  cy.endBatch();
  return cy;
};

mml.base.prototype.compareTo = function(options, treeB, similarites = []) {
  const elements = [];
  // Deep clone nodes to prevent unwanted modifications
  const mmlA = base.wrap(this.cloneDoc());
  const mmlB = base.wrap(treeB.cloneDoc());
  mmlA.prefixName('A.');
  mmlB.prefixName('B.');
  mmlA._addCTreeElements(elements, addNode, addEdge);
  const cy = mmlB.toCytoscape(options, elements);
  similarites.forEach((s) => {
    const sourceId = `A.${s.id}`;
    const sourceNode = cy.$id(sourceId);
    s.matches.forEach((m) => {
      const targetId = `B.${m.id}`;
      const targetNode = cy.$id(targetId);
      let compoundNode;
      switch (m.type) {
      case "identical":
        sourceNode.successors().forEach(c => c.remove());
        targetNode.successors().forEach(c => c.remove());
        targetNode.incomers("edge").forEach(i => i.move({
          source: i.source().id(),
          target: sourceId
        }));
        targetNode.remove();
        sourceNode.addClass('match math-identical');
        break;
      case "similar":
        sourceNode.successors().forEach(c => c.hide());
        targetNode.successors().forEach(c => c.hide());
        compoundNode = cy.add({
          group: 'nodes',
          data: {
            id: `match-similar-${sourceId}-${targetId}`,
            label: 'Similar',
          },
          classes: 'matchContainer'
        });
        sourceNode
          .move({ parent: compoundNode.id() })
          .addClass('match match-similar');
        targetNode
          .move({ parent: compoundNode.id() })
          .addClass('match match-similar');
        targetNode.remove();
        break;
      default:
        throw new Error(`Similarity type ${m.type} is not supported.`);
      }
    });
  });
  return cy;
};


module.exports.mml = mml;

module.exports.layout = layout;
