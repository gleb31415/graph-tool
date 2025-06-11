import { useState, useEffect, useRef } from 'react'
import { Graph } from 'graphology'
import Sigma from 'sigma'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import JSZip from 'jszip'
import './App.css'

function App() {
  const containerRef = useRef(null)
  const sigmaRef = useRef(null)
  const graphRef = useRef(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [nodeLabel, setNodeLabel] = useState('')
  const [nodeDescription, setNodeDescription] = useState('')
  const [nodeColor, setNodeColor] = useState('#3b82f6')
  const [nodeSize, setNodeSize] = useState(15)
  const [nodeShape, setNodeShape] = useState('circle')
  const [isCreatingEdge, setIsCreatingEdge] = useState(false)
  const [firstNodeForEdge, setFirstNodeForEdge] = useState(null)
  const [showControls, setShowControls] = useState(true)
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  
  // Use refs to store current state values for event handlers
  const isCreatingEdgeRef = useRef(isCreatingEdge)
  const firstNodeForEdgeRef = useRef(firstNodeForEdge)
  
  // Update refs when state changes
  useEffect(() => {
    isCreatingEdgeRef.current = isCreatingEdge
  }, [isCreatingEdge])
  
  useEffect(() => {
    firstNodeForEdgeRef.current = firstNodeForEdge
  }, [firstNodeForEdge])

  // Initialize graph
  useEffect(() => {
    if (!containerRef.current) return
    const graph = new Graph()
    graphRef.current = graph

    // Add some initial nodes
    graph.addNode('node1', {
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      size: 15,
      label: 'Main Idea',
      description: 'This is the main concept of the project',
      color: '#3b82f6',
      shape: 'circle',
      attachedFile: null
    })
    
    graph.addNode('node2', {
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      size: 15,
      label: 'Concept A',
      description: 'First supporting concept',
      color: '#10b981',
      shape: 'circle',
      attachedFile: null
    })
    
    graph.addNode('node3', {
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      size: 15,
      label: 'Concept B',
      description: 'Second supporting concept',
      color: '#f59e0b',
      shape: 'circle',
      attachedFile: null
    })

    // Add initial edges
    graph.addEdge('node1', 'node2', { size: 2, color: '#64748b' })

    // Apply force layout
    forceAtlas2.assign(graph, { iterations: 50 })

    // Create sigma instance with dynamic background
    const sigma = new Sigma(graph, containerRef.current, {
      renderLabels: true,
      labelFont: 'Arial',
      labelSize: 12,
      labelWeight: 'bold',
      labelColor: { color: '#000000' },
      defaultNodeColor: '#3b82f6',
      defaultEdgeColor: '#64748b',
      minCameraRatio: 0.1,
      maxCameraRatio: 10,
      enableEdgeClickEvents: true,
      enableEdgeWheelEvents: true,
      enableEdgeHoverEvents: true,
      enableCameraInteraction: true
    })
    
    sigma.getContainer().style.backgroundColor = backgroundColor

    // Custom node renderer with proper shape support
    sigma.setSetting('defaultDrawNodeFunction', (context, data, settings) => {
      const size = settings.getNodeDisplaySize(data) || data.size || 15
      const x = data.x
      const y = data.y
      const color = data.color || '#3b82f6'
      const shape = data.shape || 'circle'
      
      context.fillStyle = color
      context.strokeStyle = '#000000'
      context.lineWidth = 1.5
      
      if (shape === 'square') {
        const halfSize = size / 2
        context.fillRect(x - halfSize, y - halfSize, size, size)
        context.strokeRect(x - halfSize, y - halfSize, size, size)
      } else if (shape === 'triangle') {
        context.beginPath()
        context.moveTo(x, y - size / 2)
        context.lineTo(x - size / 2, y + size / 2)
        context.lineTo(x + size / 2, y + size / 2)
        context.closePath()
        context.fill()
        context.stroke()
      } else {
        // Default circle
        context.beginPath()
        context.arc(x, y, size / 2, 0, 2 * Math.PI)
        context.fill()
        context.stroke()
      }
    })
    sigmaRef.current = sigma

    // --- Custom drag-and-drop logic ---
    let draggedNode = null
    let isDragging = false

    sigma.on("downNode", (e) => {
      isDragging = true
      draggedNode = e.node
      graph.setNodeAttribute(draggedNode, "highlighted", true)
      if (!sigma.getCustomBBox()) sigma.setCustomBBox(sigma.getBBox())
    })

    sigma.on("moveBody", ({ event }) => {
      if (!isDragging || !draggedNode) return
      const pos = sigma.viewportToGraph(event)
      graph.setNodeAttribute(draggedNode, "x", pos.x)
      graph.setNodeAttribute(draggedNode, "y", pos.y)
      // Prevent sigma to move camera:
      event.preventSigmaDefault && event.preventSigmaDefault()
      event.original && event.original.preventDefault && event.original.preventDefault()
      event.original && event.original.stopPropagation && event.original.stopPropagation()
    })

    const handleUp = () => {
      if (draggedNode) {
        graph.removeNodeAttribute(draggedNode, "highlighted")
      }
      isDragging = false
      draggedNode = null
    }
    sigma.on("upNode", handleUp)
    sigma.on("upStage", handleUp)
    
    sigma.on('clickNode', (event) => {
      const nodeId = event.node
      const nodeData = graph.getNodeAttributes(nodeId)
      
      console.log('Node clicked:', nodeId)
      console.log('isCreatingEdge:', isCreatingEdgeRef.current)
      console.log('firstNodeForEdge:', firstNodeForEdgeRef.current)
      
      if (isCreatingEdgeRef.current) {
        console.log('In edge creation mode')
        if (!firstNodeForEdgeRef.current) {
          // First node clicked
          console.log('Setting first node:', nodeId)
          setFirstNodeForEdge(nodeId)
        } else {
          // Second node clicked - create edge and exit mode
          console.log('Second node clicked:', nodeId, 'First was:', firstNodeForEdgeRef.current)
          if (firstNodeForEdgeRef.current !== nodeId) {
            try {
              if (!graph.hasEdge(firstNodeForEdgeRef.current, nodeId)) {
                console.log('Creating edge between:', firstNodeForEdgeRef.current, 'and', nodeId)
                graph.addEdge(firstNodeForEdgeRef.current, nodeId, { size: 2, color: '#64748b' })
                console.log('Edge created successfully')
              } else {
                console.log('Edge already exists between these nodes')
              }
            } catch (e) {
              console.log('Error creating edge:', e)
            }
          } else {
            console.log('Same node clicked twice, not creating edge')
          }
          // Always exit edge creation mode after second click
          console.log('Exiting edge creation mode')
          setIsCreatingEdge(false)
          setFirstNodeForEdge(null)
        }
      } else {
        // Normal node selection (not in edge creation mode)
        console.log('Normal node selection mode, selecting node:', nodeId)
        setSelectedNode(nodeId)
        setNodeLabel(nodeData.label)
        setNodeDescription(nodeData.description || '')
        setNodeColor(nodeData.color)
        setNodeSize(nodeData.size || 15)
        setNodeShape(nodeData.shape || 'circle')
      }
    })
    sigma.on('clickStage', () => {
      if (isCreatingEdgeRef.current) {
        setIsCreatingEdge(false)
        setFirstNodeForEdge(null)
      } else {
        setSelectedNode(null)
        setNodeLabel('')
      }
    })
    return () => { 
      // dragListener.disable()
      sigma.kill() 
    }
  }, [backgroundColor])

  const addNode = () => {
    const graph = graphRef.current
    if (!graph) return

    const nodeId = `node_${Date.now()}`
    graph.addNode(nodeId, {
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      size: 15,
      label: 'New Node',
      description: '',
      color: '#3b82f6',
      shape: 'circle',
      attachedFile: null
    })
  }

  const deleteNode = () => {
    const graph = graphRef.current
    if (!graph || !selectedNode) return

    graph.dropNode(selectedNode)
    setSelectedNode(null)
    setNodeLabel('')
    setNodeDescription('')
  }

  const updateNodeLabel = () => {
    const graph = graphRef.current
    if (!graph || !selectedNode || !nodeLabel.trim()) return

    graph.setNodeAttribute(selectedNode, 'label', nodeLabel.trim())
  }

  const updateNodeDescription = () => {
    const graph = graphRef.current
    if (!graph || !selectedNode) return

    graph.setNodeAttribute(selectedNode, 'description', nodeDescription)
  }

  // --- Single file upload handler with optimized performance ---
  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file || !selectedNode) return
    const graph = graphRef.current
    if (!graph) return
    
    // For smaller files (< 5MB), use DataURL for quicker loading
    if (file.size < 5 * 1024 * 1024) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const fileData = {
          name: file.name,
          data: e.target.result,
          size: file.size,
          type: file.type,
          uploadDate: new Date().toISOString()
        }
        graph.setNodeAttribute(selectedNode, 'attachedFile', fileData)
      }
      reader.readAsDataURL(file)
    } else {
      // For larger files, store a blob URL for better performance
      const blobUrl = URL.createObjectURL(file)
      const fileData = {
        name: file.name,
        data: blobUrl,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString(),
        isBlob: true
      }
      graph.setNodeAttribute(selectedNode, 'attachedFile', fileData)
    }
    
    event.target.value = ''
  }

  const openAttachedFile = () => {
    const graph = graphRef.current
    if (!graph || !selectedNode) return

    const attachedFile = graph.getNodeAttribute(selectedNode, 'attachedFile')
    
    if (attachedFile) {
      // If it's a blob URL, open in new tab for better performance with large files
      if (attachedFile.isBlob) {
        window.open(attachedFile.data, '_blank')
        return
      }
      
      // Otherwise use download link
      const link = document.createElement('a')
      link.href = attachedFile.data
      link.download = attachedFile.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const removeAttachedFile = () => {
    const graph = graphRef.current
    if (!graph || !selectedNode) return

    graph.setNodeAttribute(selectedNode, 'attachedFile', null)
  }

  const updateNodeColor = (color) => {
    const graph = graphRef.current
    if (!graph || !selectedNode) return

    graph.setNodeAttribute(selectedNode, 'color', color)
    setNodeColor(color)
  }

  const updateNodeSize = (size) => {
    const graph = graphRef.current
    if (!graph || !selectedNode) return

    graph.setNodeAttribute(selectedNode, 'size', size)
    setNodeSize(size)
  }

  const updateNodeShape = (shape) => {
    const graph = graphRef.current
    if (!graph || !selectedNode) return

    graph.setNodeAttribute(selectedNode, 'shape', shape)
    setNodeShape(shape)
  }

  const updateBackgroundColor = (color) => {
    setBackgroundColor(color)
    // Update sigma background immediately if it exists
    if (sigmaRef.current) {
      sigmaRef.current.getContainer().style.backgroundColor = color
    }
  }

  const exportGraph = () => {
    const graph = graphRef.current
    if (!graph) return

    const graphData = {
      nodes: [],
      edges: []
    }

    // Export nodes with all their attributes
    graph.forEachNode((node, attributes) => {
      graphData.nodes.push({
        id: node,
        ...attributes
      })
    })

    // Export edges with all their attributes
    graph.forEachEdge((edge, attributes, source, target) => {
      graphData.edges.push({
        id: edge,
        source,
        target,
        ...attributes
      })
    })

    // Create download
    const dataStr = JSON.stringify(graphData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `graph-export-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImportGraph = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const graphData = JSON.parse(e.target.result)
        const graph = graphRef.current
        if (!graph) return

        // Clear existing graph
        graph.clear()

        // Import nodes
        graphData.nodes.forEach(nodeData => {
          const { id, ...attributes } = nodeData
          graph.addNode(id, attributes)
        })

        // Import edges
        graphData.edges.forEach(edgeData => {
          const { id, source, target, ...attributes } = edgeData
          try {
            graph.addEdge(source, target, attributes)
          } catch (e) {
            console.log('Error importing edge:', e)
          }
        })

        // Reset selection
        setSelectedNode(null)
        setNodeLabel('')
        setNodeDescription('')
        
        console.log('Graph imported successfully')
      } catch (error) {
        console.error('Error importing graph:', error)
        alert('Error importing graph. Please check the file format.')
      }
    }
    reader.readAsText(file)
    
    // Reset file input
    event.target.value = ''
  }

  // --- Export graph as zip ---
  const exportGraphAsZip = async () => {
    const graph = graphRef.current
    if (!graph) return
    const zip = new JSZip()
    const graphData = {
      nodes: [],
      edges: []
    }
    
    // Show loading indicator
    alert("Preparing zip export. This may take a moment for large graphs...")
    
    // Process in chunks to avoid freezing UI
    const nodes = graph.nodes()
    const edges = graph.edges()
    const chunkSize = 10
    
    // Process nodes in chunks
    for (let i = 0; i < nodes.length; i += chunkSize) {
      const chunk = nodes.slice(i, i + chunkSize)
      
      // Process each node in chunk
      for (const node of chunk) {
        const attributes = graph.getNodeAttributes(node)
        const nodeCopy = { ...attributes, id: node }
        
        if (nodeCopy.attachedFile) {
          const filePath = `files/${node}_${nodeCopy.attachedFile.name}`
          
          // Handle blob URLs differently
          if (nodeCopy.attachedFile.isBlob) {
            try {
              // Fetch the blob and convert to base64
              const response = await fetch(nodeCopy.attachedFile.data)
              const blob = await response.blob()
              const reader = new FileReader()
              
              // Convert blob to base64 and add to zip
              const base64 = await new Promise(resolve => {
                reader.onload = e => resolve(e.target.result.split(',')[1])
                reader.readAsDataURL(blob)
              })
              
              zip.file(filePath, base64, { base64: true })
              
              // Store only reference in node data
              nodeCopy.attachedFile = { 
                ...nodeCopy.attachedFile, 
                data: filePath,
                isBlob: false 
              }
            } catch (e) {
              console.error('Error processing blob URL:', e)
              // Skip this file but continue with the export
              nodeCopy.attachedFile = null
            }
          } else {
            // Regular data URL
            zip.file(filePath, nodeCopy.attachedFile.data.split(',')[1], { base64: true })
            nodeCopy.attachedFile = { ...nodeCopy.attachedFile, data: filePath }
          }
        }
        
        graphData.nodes.push(nodeCopy)
      }
      
      // Small delay to allow UI to remain responsive
      await new Promise(resolve => setTimeout(resolve, 0))
    }
    
    // Process edges
    for (const edge of edges) {
      const attributes = graph.getEdgeAttributes(edge)
      const source = graph.source(edge)
      const target = graph.target(edge)
      graphData.edges.push({ id: edge, source, target, ...attributes })
    }
    
    // Add graph.json
    zip.file('graph.json', JSON.stringify(graphData, null, 2))
    
    // Generate and download zip
    const blob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `graph-export-${new Date().toISOString().slice(0, 10)}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  // --- Import graph from zip ---
  const importGraphFromZip = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    const zip = new JSZip()
    const graph = graphRef.current
    if (!graph) return
    try {
      const loadedZip = await zip.loadAsync(file)
      const graphJson = await loadedZip.file('graph.json').async('string')
      const graphData = JSON.parse(graphJson)
      // Clear existing graph
      graph.clear()
      // Import nodes
      for (const nodeData of graphData.nodes) {
        const { id, attachedFile, ...attributes } = nodeData
        let processedFile = null
        if (attachedFile && attachedFile.data) {
          try {
            const zipFilePath = attachedFile.data
            if (loadedZip.file(zipFilePath)) {
              const base64 = await loadedZip.file(zipFilePath).async('base64')
              processedFile = { 
                ...attachedFile, 
                data: `data:${attachedFile.type};base64,${base64}` 
              }
            }
          } catch (e) {
            console.error('Error processing file:', e)
          }
        }
        graph.addNode(id, { ...attributes, attachedFile: processedFile })
      }
      // Import edges
      graphData.edges.forEach(edgeData => {
        const { id, source, target, ...attributes } = edgeData
        try {
          graph.addEdge(source, target, attributes)
        } catch (e) {
          console.log('Error importing edge:', e)
        }
      })
      setSelectedNode(null)
      setNodeLabel('')
      setNodeDescription('')
      alert('Graph imported from zip successfully!')
    } catch (e) {
      console.error('Error importing zip:', e)
      alert('Error importing zip: ' + e)
    }
    event.target.value = ''
  }

  const toggleEdgeMode = () => {
    console.log('toggleEdgeMode called, current isCreatingEdge:', isCreatingEdge)
    const newValue = !isCreatingEdge
    console.log('Setting isCreatingEdge to:', newValue)
    setIsCreatingEdge(newValue)
    setFirstNodeForEdge(null)
    console.log('Reset firstNodeForEdge to null')
  }

  const deleteEdges = () => {
    const graph = graphRef.current
    if (!graph || !selectedNode) return

    // Delete all edges connected to selected node
    const edges = graph.edges(selectedNode)
    edges.forEach(edge => graph.dropEdge(edge))
  }

  const applyLayout = () => {
    const graph = graphRef.current
    if (!graph) return

    forceAtlas2.assign(graph, { iterations: 100 })
  }

  const scaleGraph = (factor) => {
    const graph = graphRef.current
    if (!graph) return
    // Scale node positions and sizes
    graph.forEachNode((node, attrs) => {
      graph.setNodeAttribute(node, 'x', attrs.x * factor)
      graph.setNodeAttribute(node, 'y', attrs.y * factor)
      graph.setNodeAttribute(node, 'size', Math.max(5, attrs.size * factor))
    })
    // Scale edge sizes
    graph.forEachEdge((edge, attrs) => {
      graph.setEdgeAttribute(edge, 'size', Math.max(1, (attrs.size || 2) * factor))
    })
  }

  const predefinedColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
  ]

  return (
    <div className="app-container">
      {/* Controls Panel */}
      <div className={`controls-panel ${showControls ? 'visible' : 'hidden'}`}>
        <div className="controls-header">
          <h3>Graph Controls</h3>
          <button 
            className="toggle-btn"
            onClick={() => setShowControls(!showControls)}
          >
            {showControls ? '←' : '→'}
          </button>
        </div>
        <div className="controls-content">
          <div className="control-group">
            <h4>Nodes</h4>
            <button onClick={addNode} className="btn btn-primary">
              Add Node
            </button>
            <button 
              onClick={deleteNode} 
              disabled={!selectedNode}
              className="btn btn-danger"
            >
              Delete Selected
            </button>
          </div>
          <div className="control-group">
            <h4>Edges</h4>
            <button 
              onClick={toggleEdgeMode}
              className={`btn ${isCreatingEdge ? 'btn-warning' : 'btn-primary'}`}
            >
              {isCreatingEdge ? 'Cancel' : 'Create Edge'}
            </button>
            <button 
              onClick={deleteEdges}
              disabled={!selectedNode}
              className="btn btn-danger"
            >
              Delete Edges
            </button>
          </div>
          {selectedNode && !isCreatingEdge && (
            <div className="control-group">
              <h4>Edit Selected Node</h4>
              <input
                type="text"
                value={nodeLabel}
                onChange={(e) => setNodeLabel(e.target.value)}
                placeholder="Node label"
                className="input"
              />
              <button onClick={updateNodeLabel} className="btn btn-primary">
                Update Label
              </button>
              
              <textarea
                value={nodeDescription}
                onChange={(e) => setNodeDescription(e.target.value)}
                placeholder="Node description"
                className="textarea"
                rows="3"
              />
              <button onClick={updateNodeDescription} className="btn btn-primary">
                Update Description
              </button>
              
              <div className="file-section">
                <h5>Attached File</h5>
                {(() => {
                  const attachedFile = graphRef.current?.getNodeAttribute(selectedNode, 'attachedFile')
                  return attachedFile ? (
                    <div className="file-info">
                      <p className="file-name">
                        📄 {attachedFile.name} <span className="file-size">({(attachedFile.size / 1024).toFixed(1)}KB)</span>
                      </p>
                      <div className="file-actions">
                        <button 
                          onClick={() => openAttachedFile()} 
                          className="btn btn-small btn-primary"
                        >
                          Download
                        </button>
                        <button 
                          onClick={() => removeAttachedFile()} 
                          className="btn btn-small btn-danger"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="no-files">No file attached</p>
                  )
                })()}
                <div className="file-upload">
                  <input
                    type="file"
                    id="file-upload"
                    onChange={handleFileUpload}
                    className="file-input"
                  />
                  <label htmlFor="file-upload" className="btn btn-primary file-label">
                    + Add File
                  </label>
                  <p className="file-note">
                    📱 Note: Only one file per node. Files stored locally in browser.
                  </p>
                </div>
              </div>
              
              <div className="color-picker">
                <p>Colors:</p>
                <div className="color-grid">
                  {predefinedColors.map(color => (
                    <button
                      key={color}
                      className={`color-btn ${nodeColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => updateNodeColor(color)}
                    />
                  ))}
                </div>
              </div>

              <div className="node-size-picker">
                <p>Size:</p>
                <input
                  type="range"
                  min="8"
                  max="40"
                  value={nodeSize}
                  onChange={(e) => updateNodeSize(parseInt(e.target.value))}
                  className="size-slider"
                />
                <span className="size-value">{nodeSize}px</span>
              </div>

              <div className="node-shape-picker">
                <p>Shape:</p>
                <div className="shape-grid">
                  {['circle', 'square', 'triangle'].map(shape => (
                    <button
                      key={shape}
                      className={`shape-btn ${nodeShape === shape ? 'selected' : ''}`}
                      onClick={() => updateNodeShape(shape)}
                    >
                      {shape === 'circle' && '●'}
                      {shape === 'square' && '■'}
                      {shape === 'triangle' && '▲'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="control-group">
            <h4>Background</h4>
            <div className="color-picker">
              <p>Graph Background:</p>
              <div className="color-grid">
                {['#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#343a40', '#212529', '#000000'].map(color => (
                  <button
                    key={color}
                    className={`color-btn ${backgroundColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color, border: color === '#ffffff' ? '2px solid #ccc' : 'none' }}
                    onClick={() => updateBackgroundColor(color)}
                  />
                ))}
              </div>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => updateBackgroundColor(e.target.value)}
                className="color-input"
                title="Custom background color"
              />
            </div>
          </div>

          <div className="control-group">
            <h4>Layout</h4>
            <button onClick={applyLayout} className="btn btn-primary">
              Apply Force Layout
            </button>
          </div>

          <div className="control-group">
            <h4>Import/Export</h4>
            <button onClick={exportGraph} className="btn btn-primary">
              Export Graph
            </button>
            <input
              type="file"
              id="graph-import"
              onChange={handleImportGraph}
              accept=".json"
              className="file-input"
            />
            <label htmlFor="graph-import" className="btn btn-primary file-label">
              Import Graph
            </label>
          </div>
          <div className="control-group">
            <h4>Import/Export as Zip</h4>
            <button onClick={exportGraphAsZip} className="btn btn-primary">
              Export as Zip
            </button>
            <input
              type="file"
              id="graph-import-zip"
              onChange={importGraphFromZip}
              accept=".zip"
              className="file-input"
            />
            <label htmlFor="graph-import-zip" className="btn btn-primary file-label">
              Import Zip
            </label>
          </div>
          <div className="control-group">
            <h4>Scale Graph</h4>
            <button className="btn btn-primary" onClick={() => scaleGraph(1.2)}>Scale Up</button>
            <button className="btn btn-primary" onClick={() => scaleGraph(0.8)}>Scale Down</button>
          </div>
          {isCreatingEdge && (
            <div className="status-message">
              {firstNodeForEdge ? 'Now click the second node' : 'Click the first node'}
            </div>
          )}
        </div>
      </div>
      {/* Graph Container */}
      <div 
        ref={containerRef} 
        className="graph-container"
        style={{ 
          width: showControls ? 'calc(100vw - 320px)' : '100vw',
          height: '100vh'
        }}
      />
      {/* Instructions */}
      <div className="instructions">
        <p>
          <strong>Instructions:</strong> Click nodes to select • Drag nodes to move them • 
          Use "Create Edge" then click 2 nodes • Right panel to customize selected nodes
        </p>
      </div>
    </div>
  )
}

export default App
