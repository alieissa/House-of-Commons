var gov_side = d3.select('#gov_side');
var opp_side = d3.select('#opp_side');

opp_side
  .selectAll('rect')
  .enter()
  .select('rect')
  .data()
