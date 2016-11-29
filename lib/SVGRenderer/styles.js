module.exports = `<![CDATA[
  .node > rect {
    fill: #fff;
    stroke: steelblue;
    stroke-width: 2;
  }

  .node--leaf circle, .node--leaf rect {
    stroke-dasharray: 2, 2;
  }

  .link {
    fill: none;
    stroke: #ccc;
    stroke-width: 2px;
  }

  text {
    text-anchor: middle;
    font-family: 'Georgia', serif;
    font-style: italic;
    font-size: 1rem;
    fill: #5d5d5d;
    cursor: default;
  }
]]>`;