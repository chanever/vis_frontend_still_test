import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { mockData } from '../mockData';

const CallGraph = ({ selectedFunction = null, onNodeClick = null }) => {
  const svgRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const nodeSelectionRef = useRef(null);
  const linkSelectionRef = useRef(null);
  const nodesDataRef = useRef([]);
  const edgesDataRef = useRef([]);
  const selectedFunctionRef = useRef(selectedFunction);
  const onNodeClickRef = useRef(onNodeClick);

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const getDatumId = useCallback((endpoint) => (
    typeof endpoint === 'string' ? endpoint : endpoint.id
  ), []);

  const applyHighlight = useCallback((selectedId) => {
    const nodeSelection = nodeSelectionRef.current;
    const linkSelection = linkSelectionRef.current;
    const edges = edgesDataRef.current;

    if (!nodeSelection || !linkSelection) return;

    const highlightedNeighbors = new Set();
    const highlightedEdgeKeys = new Set();
    const createEdgeKey = (source, target) => `${source}->${target}`;

    if (selectedId) {
      edges.forEach(edge => {
        const sourceId = getDatumId(edge.source);
        const targetId = getDatumId(edge.target);
        if (sourceId === selectedId) {
          highlightedNeighbors.add(targetId);
          highlightedEdgeKeys.add(createEdgeKey(sourceId, targetId));
        } else if (targetId === selectedId) {
          highlightedNeighbors.add(sourceId);
          highlightedEdgeKeys.add(createEdgeKey(sourceId, targetId));
        }
      });
    }

    nodeSelection.select('circle')
      .attr('fill', d => {
        if (selectedId && d.id === selectedId) return '#2563eb';
        if (selectedId && highlightedNeighbors.has(d.id)) return '#93c5fd';
        return '#60a5fa';
      })
      .attr('stroke', d => {
        if (selectedId && (d.id === selectedId || highlightedNeighbors.has(d.id))) return '#1d4ed8';
        return '#ffffff';
      })
      .attr('stroke-width', d => (selectedId && d.id === selectedId ? 3 : 2))
      .attr('opacity', d => {
        if (!selectedId) return 1;
        return (d.id === selectedId || highlightedNeighbors.has(d.id)) ? 1 : 0.25;
      });

    linkSelection
      .attr('stroke', d => {
        if (!selectedId) return '#999';
        const key = createEdgeKey(getDatumId(d.source), getDatumId(d.target));
        return highlightedEdgeKeys.has(key) ? '#2563eb' : '#cbd5f5';
      })
      .attr('stroke-opacity', d => {
        if (!selectedId) return 0.6;
        const key = createEdgeKey(getDatumId(d.source), getDatumId(d.target));
        return highlightedEdgeKeys.has(key) ? 0.9 : 0.15;
      });
  }, [getDatumId]);

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // 초기화

    const nodes = mockData.nodes.map(node => ({ ...node }));
    const edges = mockData.edges.map(edge => ({ ...edge }));

    nodesDataRef.current = nodes;
    edgesDataRef.current = edges;

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide().radius(30));

    const container = svg.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#94a3b8');

    const link = container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(edges)
      .enter().append('line')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)');

    const node = container.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    node.append('circle')
      .attr('r', d => Math.max(15, Math.min(25, d.degree * 2)));

    node.append('text')
      .attr('dx', 0)
      .attr('dy', 5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text(d => d.name.length > 8 ? d.name.substring(0, 8) + '...' : d.name);

    node.append('text')
      .attr('dx', 0)
      .attr('dy', 18)
      .attr('text-anchor', 'middle')
      .attr('font-size', '8px')
      .attr('fill', '#666')
      .text(d => `deg: ${d.degree}`);

    node
      .on('mouseover', function(event, d) {
        if (!selectedFunctionRef.current) {
          const connectedNodes = new Set();
          edgesDataRef.current.forEach(edge => {
            const sourceId = getDatumId(edge.source);
            const targetId = getDatumId(edge.target);
            if (sourceId === d.id) connectedNodes.add(targetId);
            if (targetId === d.id) connectedNodes.add(sourceId);
          });

          node.select('circle')
            .attr('opacity', n =>
              n.id === d.id || connectedNodes.has(n.id) ? 1 : 0.3
            );

          link
            .attr('stroke-opacity', e =>
              getDatumId(e.source) === d.id || getDatumId(e.target) === d.id ? 0.9 : 0.1
            )
            .attr('stroke', e =>
              getDatumId(e.source) === d.id || getDatumId(e.target) === d.id ? '#2563eb' : '#cbd5f5'
            );
        }

        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0,0,0,0.8)')
          .style('color', 'white')
          .style('padding', '8px')
          .style('border-radius', '4px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000');

        tooltip.html(`
          <strong>${d.name}</strong><br/>
          In-degree: ${d.in_degree}<br/>
          Out-degree: ${d.out_degree}<br/>
          Total degree: ${d.degree}
        `);
      })
      .on('mousemove', function(event) {
        d3.select('.tooltip')
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', () => {
        if (!selectedFunctionRef.current) {
          node.select('circle').attr('opacity', 1);
          link
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6);
        } else {
          applyHighlight(selectedFunctionRef.current);
        }
        d3.select('.tooltip').remove();
      })
      .on('click', function(event, d) {
        const handler = onNodeClickRef.current;
        if (handler) {
          handler(d);
        }
      });

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    nodeSelectionRef.current = node;
    linkSelectionRef.current = link;
    applyHighlight(selectedFunctionRef.current);

    return () => {
      simulation.stop();
      nodeSelectionRef.current = null;
      linkSelectionRef.current = null;
    };
  }, [dimensions, applyHighlight, getDatumId]);

  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
  }, [onNodeClick]);

  useEffect(() => {
    selectedFunctionRef.current = selectedFunction;
    applyHighlight(selectedFunction);
  }, [selectedFunction, applyHighlight]);

  return (
    <div className="w-full h-full relative">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="border border-gray-200 rounded-lg"
        style={{ minHeight: '500px' }}
      />
      
      {/* Controls */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 space-y-2">
        <div className="text-sm font-medium text-gray-700">Graph Controls</div>
        <div className="text-xs text-gray-500">
          • Drag nodes to move them<br/>
          • Scroll to zoom in/out<br/>
          • Click nodes for details<br/>
          • Hover to see connections
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3">
        <div className="text-sm font-medium text-gray-700 mb-2">Legend</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>기본 노드</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-300"></div>
            <span>연결된 노드</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span>선택된 노드</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallGraph;
