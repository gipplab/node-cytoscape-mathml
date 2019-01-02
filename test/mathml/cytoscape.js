'use strict';

const cytoscapeRenderer = require('../../mathml-cytoscape').mml;
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const file = path.join(__dirname,'..','data','09-goat.mml.xml');
const xmlString = fs.readFileSync(file, 'utf8');
const fileA = path.join(__dirname,'..','data','07-orig-1-21.mml.xml');
const xmlStringA = fs.readFileSync(fileA, 'utf8');

describe('cytoscape rendering', () => {

  it('should initialize with goat input', () => cytoscapeRenderer(xmlString));
  it('should get correct number of nodes in goat tree', () => {
    const mathml = cytoscapeRenderer(xmlString);
    const cy = mathml.toCytoscape({
      headless: true,
      styleEnabled: true
    });
    assert(cy);
    assert.equal(cy.elements().length,39);
    assert.equal(cy.edges().length,19);
    assert.equal(cy.nodes().length,20);
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
    assert.equal(cy.elements().filter(e => e.visible()).length,25);
    assert.equal(cy.edges().filter(e => e.visible()).length,12);
    assert.equal(cy.nodes().filter(e => e.visible()).length,13);
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
    assert.equal(cy.elements().length,105);
    assert.equal(cy.edges().length,52);
    assert.equal(cy.nodes().length,53);
    cy.destroy();
  });
});

describe('cytoscape comparison', () => {
  it('should display similaries example 07', () => {
    const mml = cytoscapeRenderer(xmlString);
    const cy = mml.compareTo({
      headless: true,
      styleEnabled: true
    }, mml);
    assert(cy);
    assert.equal(cy.elements().length, 39 * 2);
    assert.equal(cy.edges().length, 19 * 2);
    assert.equal(cy.nodes().length, 20 * 2);
    cy.destroy();
  });
});

