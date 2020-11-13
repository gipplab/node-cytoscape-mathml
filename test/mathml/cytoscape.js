/* global describe, it */

'use strict';

const cytoscapeRenderer = require('../../mathml-cytoscape').mml;
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const file = path.join(__dirname, '..', 'data', '09-goat.mml.xml');
const xmlString = fs.readFileSync(file, 'utf8');
const fileA = path.join(__dirname, '..', 'data', '07-orig-1-21.mml.xml');
const xmlStringA = fs.readFileSync(fileA, 'utf8');
const goatEdges = 19;
const goatNodes = 20;
const goatElements = goatEdges + goatNodes;

describe('cytoscape rendering', () => {

  it('should initialize with goat input', () => cytoscapeRenderer(xmlString));
  it('should get correct number of nodes in goat tree', () => {
    const mathml = cytoscapeRenderer(xmlString);
    const cy = mathml.toCytoscape({
      headless: true,
      styleEnabled: true
    });
    assert(cy);
    assert.equal(cy.elements().length, goatElements);
    assert.equal(cy.edges().length, goatEdges);
    assert.equal(cy.nodes().length, goatNodes);
    // required if headless styles are enabled
    cy.destroy();
  });
  it('should get hide apply nodes', () => {
    const mathml = cytoscapeRenderer(xmlString);
    const cy = mathml.toCytoscape({
      headless: true,
      styleEnabled: true,
      applyForm: true
    });
    assert(cy);
    assert.equal(cy.elements().filter(e => e.visible()).length, 25);
    assert.equal(cy.edges().filter(e => e.visible()).length, 12);
    assert.equal(cy.nodes().filter(e => e.visible()).length, 13);
    // required if headless styles are enabled
    cy.destroy();
  });
  it('should work with example 07', () => {
    const mathml = cytoscapeRenderer(xmlStringA);
    const cy = mathml.toCytoscape({
      headless: true,
      styleEnabled: true
    });
    assert(cy);
    assert.equal(cy.elements().length, 105);
    assert.equal(cy.edges().length, 52);
    assert.equal(cy.nodes().length, 53);
    cy.destroy();
  });
});

describe('cytoscape comparison', () => {
  it('should display two goats in one graph', () => {
    const mml = cytoscapeRenderer(xmlString);
    const cy = mml.compareTo({
      headless: true,
      styleEnabled: true
    }, mml);
    assert(cy);
    assert.equal(cy.elements().length, goatElements * 2);
    assert.equal(cy.edges().length, goatEdges * 2);
    assert.equal(cy.nodes().length, goatNodes * 2);
    cy.destroy();
  });
  it('should display two connect LHS goats', () => {
    const mml = cytoscapeRenderer(xmlString);
    const cy = mml.compareTo({
      headless: true,
      styleEnabled: true
    }, mml, [{
      id: "e42",
      matches: [{ id: "e42", type: "identical" }]
    }]);
    assert(cy);
    assert.equal(cy.elements().length, goatElements * 2 - 4 - 3 - 3 - 3);
    assert.equal(cy.nodes().length, goatNodes * 2 - 4 - 3);
    assert.equal(cy.edges().length, goatEdges * 2 - 3 - 3);
    cy.destroy();
  });
  it('should highlight RHS in two goates', () => {
    const mml = cytoscapeRenderer(xmlString);
    const cy = mml.compareTo({
      headless: true,
      styleEnabled: true
    }, mml, [{
      id: "e42",
      matches: [{ id: "e42", type: "similar" }]
    }]);
    assert(cy);
    assert.equal(cy.elements().length, goatElements * 2 - 4);
    assert.equal(cy.nodes().length, goatNodes * 2);
    assert.equal(cy.edges().length, goatEdges * 2 - 4);
    cy.destroy();
  });
  it('should report unknown similarity types', () => {
    const mml = cytoscapeRenderer(xmlString);
    assert.throws(() => mml.compareTo({
      headless: true,
      styleEnabled: true
    }, mml, [{
      id: "e42",
      matches: [{ id: "e42", type: "wrong-type" }]
    }]), Error);
  });
});

