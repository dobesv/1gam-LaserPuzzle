
local level1 = {
  " R    G ",
  "RrrrmrmG",
  " mrrrrrR",
  "BbbbmrrR",
  " mbbbrm ",
  "Ggggmbm ",
  "Bmgggbb ",
  " B  G B "
}
--local level1 = {
--  " B    G ",
--  " brrmrg ",
--  " brrrrm ",
--  " bbbmrr ",
--  " mbbbrm ",
--  " gggmbb ",
--  "Bmgggbb ",
--  " B    B "
--}


-- Grid:
-- Filters are offset by 80px from the pivot center 
-- Filters are placed at 160px intervals
-- Pivots are thus placed at 320px intervals
-- The filter is itself about 100px
local filterOffset = 80
local filterGridSize = filterOffset*2
local pivotGridSize = filterGridSize*2 
local cardinals = {up=0,right=90,down=180,left=270}
local columns
local rows
local topRow
local topRowY
local bottomRow
local bottomRowY
local leftColumn
local leftColumnX
local rightColumn
local rightColumnX
local pivots = {}
local lasers = {}

function nearestInt(n)
  return math.floor(0.5 + n)
end

-- Get the Y coordinate of the given row
-- The first row is numbered 1, in lua tradition
function rowY(n)
  if n == topRow then return topRowY end
  if n == bottomRow then return bottomRowY end
  return nearestInt(((rows / 2) - n) * filterGridSize + filterOffset)
end
-- Get the X coordinate of the given column
-- Note that the left and right columns have the emitters and the
-- middle columns have the filters.
-- The first column is number 1, in lua tradition
function columnX(n)
  if n == leftColumn then return leftColumnX end
  if n == rightColumn then return rightColumnX end 
  return nearestInt((n - (columns / 2)) * filterGridSize - filterOffset)
end

-- Filters are ordered clockwise starting at top-left; so TL, TR, BR, BL
function addPivot(row,column,a,b,c,d)
  local x = columnX(column) + filterOffset
  local y = rowY(row) - filterOffset
  local pivot = director:createSprite(x,y,"images/Pivot.png")
  pivot.xAnchor = 0.5
  pivot.yAnchor = 0.5
  local filters = {}
  pivot.filters = filters
  local function filterRow(n)
    return row + math.floor(n/2) -- row + {0,0,1,1}[n]
  end
  local function filterColumn(n)
    return column + math.floor(((n+1)%4)/2) -- column + {0,1,1,0}[n]
  end
  local function filterX(n)
    return columnX(filterColumn(n))-x
  end
  local function filterY(n)
    return rowY(filterRow(n))-y
  end
  local function addFilter(col)
    local n = # filters
    local fx = filterX(n) 
    local fy = filterY(n)
    local filter = director:createSprite(fx+pivot.w/2,fy+pivot.h/2,"images/filter_"..col..".png")
    filter.row = filterRow(n)
    filter.column = filterColumn(n)
    filter.rotation = (n+1) * 90
    filter.sceneOrientation = filter.rotation 
    filter.xAnchor = 0.5
    filter.yAnchor = 0.5
    filter.filterType = col
    pivot:addChild(filter)
    --print("filter", n, filter.x, filter.y, filter.row, filter.column, filter.rotation, filter.filterType)
    table.insert(filters,filter)
    n = n + 1
  end
  for i,v in ipairs({a,b,c,d}) do
    addFilter(v)
  end
  
  local function onTouch(event)
    if event.phase == "began" then
      local rot = (pivot.rotation + 90) % 360
      pivot.rotation = rot
      local nrotation = (rot / 90)
      for index,filter in ipairs(filters) do
        local n = index-1
        local rotatedN = (n + nrotation) % 4 
        filter.row = filterRow(rotatedN)
        filter.column = filterColumn(rotatedN)
        filter.sceneOrientation = rot + filter.rotation
        --print("Filter rotated", n, rot, rotatedN, filter.sceneOrientation, filter.row, filter.column, filter.filterType)
      end
      updateLasers()
    end
  end
  pivot:addEventListener("touch", onTouch)
  --print("Added one pivot at "..x..","..y)
  table.insert(pivots,pivot)
  return pivot
end

function findFilter(row,column)
  for n,pivot in ipairs(pivots) do
    for nn,filter in ipairs(pivot.filters) do
      if column == filter.column and row == filter.row then
        return filter
      end 
    end
  end
  return nil
end

function addLaser(row,column,laserColor,angle)
  local laser = director:createSprite(columnX(column),rowY(row), "images/laser_"..laserColor..".png")
  laser.xAnchor = 0.5
  laser.yAnchor = 0.5
  laser.laserColor = laserColor
  laser.laserAngle = angle
  laser.row = row
  laser.column = column
  laser.rotation = (angle + 270) % 360
  table.insert(lasers,laser)
  --print("Add laser", row, column, laser.x, laser.y, laserColor, angle)
  return laser
end

function findLaser(row,column)
  for n,laser in ipairs(lasers) do
    if row == laser.row and column == laser.column then
      return laser
    end
  end
  return nil
end

-- Walk along the path of the laser beam.  Gather the following:
-- 1. Path of the laser as a list of x,y points
-- 2. Filters that were passed through / mirrors hit, if any
-- 3. Sensor that was hit, if any
function traceLaser(startRow,startColumn,startAngle,startColor)
  local row = startRow
  local column = startColumn
  local angle = startAngle
  local color = startColor
  local events = {}
  local stopped = false
  local sensor = nil
  local trace = function(s) return nil end -- print
  trace("Starting laser trace", startRow, startColumn, startAngle, color)
  repeat
    local prevRow = row
    local prevColumn = column
    local prevAngle = angle
    local filter = nil
    local turned = false
    repeat
      row = nearestInt(row - math.cos(math.rad(angle)))
      column = nearestInt(column + math.sin(math.rad(angle)))
      if row > bottomRow or row < topRow or column > rightColumn or column < leftColumn then
        trace("Stopping at edge", row, column)
        stopped = true
      else
        filter = findFilter(row, column)
        if filter then
          if filter.filterType == "mirror" then
            -- Normal is \
            -- Flipped is /
            -- > + \ == v == +90
            -- < + \ == ^ == +90
            -- ^ + / == > == +90
            -- v + / == < == +90
            -- > + / == ^ == -90
            -- < + / == v == -90
            -- ^ + \ == < == -90
            -- v + \ == > == -90
            local normal = (filter.sceneOrientation % 180) == 0 
            local vertical = (angle % 180) == 0
            if normal ~= vertical then
              angle = angle + 90
            else
              angle = angle - 90
            end
            turned = true
            trace("Hit mirror at ", row, column, filter.sceneOrientation, "old angle", prevAngle, "new angle", angle, col, normal, vertical)
          elseif filter.filterType == "clear" then
            trace("Clear filter", row, column)
            -- Pass through
          elseif filter.filterType ~= color then
            trace("Hit wrong color ", row, column, filter.filterType)
            stopped = true
          else
            trace("Hit same color ", row, column, filter.filterType)
          end
        else
          local laser = findLaser(row,column)
          if laser then
            stopped = true
            if laser.laserColor == color then
              sensor = laser
              trace("Found right color", row, column)
            else 
              trace("Found wrong color", row, column)
            end
          else
            trace("Empty space .... ", row, column)
          end
        end
      end
    until stopped or turned
    table.insert(events, {filter=filter,row=row,column=column,
                          prevRow=prevRow,prevColumn=prevColumn,
                          color=color})
  until stopped or (# events >= 100)
  return {events=events,sensor=sensor}
end


-- head and tail should be pointing "up" in the original image.  The midImg should 
-- be 1 pixel tall and the same width as the head and tail images.
function cappedLine(x,y,angle,length,headImg,midImg,tailImg)
  local head = director:createSprite(x,y,headImg)
  head.xAnchor = 0.5
  head.yAnchor = 1
  head.rotation = 180
  local tail = director:createSprite(math.floor(x + (math.sin(math.rad(angle))*length)),
                                     math.floor(y + (math.cos(math.rad(angle))*length)),
                                     headImg)
  tail.xAnchor = 0.5
  tail.yAnchor = 1.0
  tail.rotation = angle
  local beamMid = director:createSprite(math.floor(x + (math.sin(math.rad(angle))*head.h)),
                                        math.floor(y + (math.cos(math.rad(angle))*head.h)),
                                        headImg)
  beamMid.xAnchor = 0.5
  beamMid.yScale = length - head.h - tail.h
  beamMid.rotation = angle
  return beamMid
end

function distanceBetween(x,y,endX,endY)
    local dx = endX-x
    local dy = endY-y
    local distance
    -- Common case is that this is a vertical or horizontal line
    if dx == 0 then distance = math.abs(dy)
    elseif dy == 0 then distance = math.abs(dx)
    -- Diagonal lines are a bit more complicated
    else distance = math.sqrt(dx*dx + dy*dy)
    end
    
    --print("distance", x, y, endX, endY, dx, dy, distance)
    return distance
end

function createContainer(x,y)
  return director:createNode({x=x,y=y})
end

-- Draw a line from x,y to endX,endY with the headImg drawn at x,y, the tailImg drawn
-- at endX,endY, and the midImg stretched to fit over the space in between.  The "top edge"
-- of the headImg should be touched the start position and the "top edge" of the tailImg should
-- be touching the end position.
function cappedLineTo(x,y,endX,endY,headImg,midImg,tailImg)
  local angleDegs
  local dx = endX-x
  local dy = endY-y
  if dx == 0 then
    if y < endY then angleDegs = 0 else angleDegs = 180 end
  else
    if x < endX then angleDegs = 90 else angleDegs = 270 end
  end
  
  local angleRads = math.rad(angleDegs) --math.atan2(endY-y,endX-x)
  local length = distanceBetween(0,0,dx,dy)
  local head = director:createSprite(0,0,headImg)
  head.xAnchor = 0.5
  head.yAnchor = 1
  head.rotation = 180
  --print("line", x, y, endX, endY, angleDegs, length)
  local tail = director:createSprite(0, length, tailImg)
  tail.xAnchor = 0.5
  tail.yAnchor = 1.0
  tail.rotation = 0
  local midpointX = dx/2
  local midpointY = dy/2
  local beamMid = director:createSprite(0, length/2, midImg)
  beamMid.xAnchor = 0.5
  beamMid.yAnchor = 0.5
  beamMid.yScale = length - head.h - tail.h
  beamMid.rotation = 0
  --print("beamMid", "rotation", beamMid.rotation, beamMid.x, beamMid.y, length)
  
  local container = createContainer(x,y)
  container.xAnchor = 0
  container.yAnchor = 0
  container.rotation = angleDegs
  container:addChild(head)
  container:addChild(beamMid)
  container:addChild(tail)
  return container
end

function drawLaser(x,y,endX,endY,col)
  local line = cappedLineTo(x,y,endX,endY,"images/beam_"..col.."_end.png","images/beam_"..col.."_mid.png","images/beam_"..col.."_end.png")
  return line
end

function fireLaser(x,y,row,column,angle,color)
  local trace = traceLaser(row,column,angle,color)
  --print("Trace returned", #trace.events, "events")
  local fullRoute = createContainer(0,0)
  --if trace.sensor then print("Trace hit a sensor") end
  for n,event in ipairs(trace.events) do
    if n <= 20 then
      --print("draw laser", event.prevX, event.prevY, event.x, event.y, event.color)
      local part = drawLaser(columnX(event.prevColumn), rowY(event.prevRow), 
                             columnX(event.column),     rowY(event.row),
                             event.color)
      fullRoute:addChild(part)
    end
  end
  fullRoute.zOrder = -1
  fullRoute.didReachSensor = trace.sensor ~= nil
  return fullRoute
end



function setupScene()
  local gameScene = director:getCurrentScene()
  local bgSprite = director:createSprite(0,0,"images/bg.jpg")
  bgSprite.zOrder = -999
  local bgScale = math.min(director.displayWidth / bgSprite.w, director.displayHeight / bgSprite.h)
  bgSprite:scale(bgScale)
  local frameSprite = director:createSprite(0,0,"images/frame.png")
  frameSprite:scale(bgScale)
  frameSprite.zOrder = 999
end

local colorLetterToWord = {
  r="red",g="green",b="blue",m="mirror"
}

function setupLevel(level)
  local levelNode = createContainer(0,0)
  
  rows = #level
  columns = #(level[1])
  if rows <= 2 then
    print("Need more than 2 rows to have an actual level.  Something is wrong with this level spec")
    return false
  end
  for n = 2, #level do
    if #(level[n]) ~= columns then
      print("Columns in row "..n.." aren't the same number as the first row", n, columns, level[n])
    end
  end
  
  local targetWidth  = 680
  local targetHeight = 580
  local fullWidth = (columns-1) * filterGridSize
  local fullHeight = (rows-1) * filterGridSize
  local scale = math.min(targetWidth/fullWidth,targetHeight/fullHeight)
  levelNode:scale(scale)
  levelNode.x = director.displayWidth / 2
  levelNode.y = director.displayHeight / 2
  local scene = director:getCurrentScene()
  scene.levelNode = levelNode

  topRow = 1
  topRowY = 540
  bottomRow = rows
  bottomRowY = -540
  

  leftColumn = 1
  leftColumnX = -640
  rightColumn = columns
  rightColumnX = 640
  
  --print("Level", scale, rows, columns, topRowY, bottomRowY, leftColumnX, rightColumnX)
  
  -- Add all the lasers
  local topLaserSpec = string.lower(level[1])
  for n=2, #topLaserSpec - 1 do
    local ch = topLaserSpec:sub(n,n)
    if ch ~= " " then
      local color = colorLetterToWord[ch]
      if color == "mirror" or not color then 
        print("Error: Unexpected color char", ch, "in", topLaserSpec, n)
      else
        levelNode:addChild(addLaser(topRow, n, color, 180))
      end
    end
  end
  for row = 2, #level-1 do
    local rowSpec = string.lower(level[row])
    local leftLaserCh = rowSpec:sub(1,1)
    local laserY = rowY(row)
    if leftLaserCh ~= " " then
      local color = colorLetterToWord[leftLaserCh]
      if color == "mirror" or not color then 
        print("Error: Unexpected color char", leftLaserCh, "in", rowSpec, row)
      else
        levelNode:addChild(addLaser(row, leftColumn, color, 90))
      end
    end
    local rightLaserCh = rowSpec:sub(-1)
    if rightLaserCh ~= " " then
      local color = colorLetterToWord[rightLaserCh]
      if color == "mirror" or not color then 
        print("Error: Unexpected color char", rightLaserCh, "in", rowSpec, row)
      else
        levelNode:addChild(addLaser(row, rightColumn, color, -90))
      end
    end
  end
  local bottomLaserSpec = string.lower(level[#level])
  for n=2, #bottomLaserSpec - 1 do
    local ch = bottomLaserSpec:sub(n,n)
    if ch ~= " " then
      local col = colorLetterToWord[ch]
      if col == "mirror" or not col then 
        print("Error: Unexpected color char", ch, "in", bottomLaserSpec, n)
      else
        levelNode:addChild(addLaser(bottomRow, n, col, 0))
      end
    end
  end
  -- Now the spinners
  for row=2,#level-1,2 do
    for column=2,columns-1,2 do
      local pivotY = rowY(row) - filterOffset
      local pivotX = columnX(column) + filterOffset
      function filterColorAt(row,column)
        local ch = level[row]:sub(column,column)
        local col = colorLetterToWord[ch]
        if not col then
          print("Error: Unexpected color char", ch, "at row", row, "column", column)
          return "clear"
        else
          return col
        end
      end
      local tl = filterColorAt(row,column)
      local tr = filterColorAt(row,column+1)
      local br = filterColorAt(row+1,column+1)
      local bl = filterColorAt(row+1,column)
      --print("adding pivot", row, column, row+1, column+1, pivotX, pivotY)
      levelNode:addChild(addPivot(row,column,tl,tr,br,bl))
    end
  end
end


local laserBeams = {}
function clearLasers()
  for n,beam in ipairs(laserBeams) do
    --print("Removing beam", beam)
    beam = beam:removeFromParent()
    -- beam:destroy()
  end
  laserBeams = {}
end
function updateLasers()
  clearLasers()
  for n,laser in ipairs(lasers) do
    local beam = fireLaser(laser.x, laser.y, laser.row, laser.column, laser.laserAngle, laser.laserColor)
    laser.parent:addChild(beam)
    --print("Created beam", beam)
    table.insert(laserBeams, beam)
  end
end

function startGame()
  setupScene()
  setupLevel(level1)
  updateLasers()
end

system:addTimer(startGame, 0.1, 1, 0.1)
