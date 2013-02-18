
--local level1 = {
--  " R    G ",
--  "RrrrmrmG",
--  " mrrrrrR",
--  "BbbbmrrR",
--  " mbbbrm ",
--  "Ggggmbm ",
--  "Bmgggbb ",
--  " B  G B "
--}
local level1 = {
  " B    G ",
  " brrmrg ",
  " brrrrm ",
  " bbbmrr ",
  " mbbbrm ",
  " gggmbb ",
  "Bmgggbb ",
  " B    B "
}


-- Grid:
-- Filters are offset by 80px from the pivot center 
-- Filters are placed at 160px intervals
-- Pivots are thus placed at 320px intervals
-- The filter is itself about 100px
local filterOffset = 80
local filterGridSize = filterOffset*2
local pivotGridSize = filterGridSize*2 
local cardinals = {up=0,right=90,down=180,left=270}

local pivots = {}
local lasers = {}

function nearestInt(n)
  return math.floor(0.5 + n)
end

-- Filters are ordered clockwise starting at top-left; so TL, TR, BR, BL
function addPivot(x,y,a,b,c,d)
  local pivot = director:createSprite(x,y,"images/Pivot.png")
  pivot.xAnchor = 0.5
  pivot.yAnchor = 0.5
  local filters = {}
  pivot.filters = filters
  function filterX(n)
    if n == 0 or n == 3 then 
      return -filterOffset
    else
      return filterOffset
    end
  end
  function filterY(n)
    if n == 2 or n == 3 then 
      return -filterOffset
    else
      return filterOffset 
    end
  end
  function addFilter(col)
    local n = # filters
    local fx = filterX(n) 
    local fy = filterY(n)
    local filter = director:createSprite(fx+pivot.w/2,fy+pivot.h/2,"images/filter_"..col..".png")
    filter.sceneX = x+fx
    filter.sceneY = y+fy
    if col == "mirror" then
      -- Rotate appropriately ...
      filter.rotation = (n+1) * 90
    end 
    filter.sceneOrientation = filter.rotation 
    filter.xAnchor = 0.5
    filter.yAnchor = 0.5
    filter.filterType = col
    pivot:addChild(filter)
    --print("filter "..n..": "..col.." at "..filter.sceneX..","..filter.sceneY)
    table.insert(filters,filter)
    n = n + 1
  end
  for i,v in ipairs({a,b,c,d}) do
    addFilter(v)
  end
  
  function onTouch(event)
    if event.phase == "began" then
      local rot = (pivot.rotation + 90) % 360
      pivot.rotation = rot
      for n,filter in ipairs(filters) do
        local t = math.rad(rot + (90*(n-2)))
        local sinT = math.sin(t)
        local cosT = math.cos(t)
        local fx = nearestInt(filterOffset * cosT + filterOffset * sinT)
        local fy = nearestInt(filterOffset * cosT - filterOffset * sinT)
        filter.sceneX = x + fx
        filter.sceneY = y + fy
        filter.sceneOrientation = rot + filter.rotation
        print("Filter rotation ", n, rot, filter.sceneOrientation, fx, fy, cosT, sinT, filter.filterType)
      end
      updateLasers()
    end
  end
  pivot:addEventListener("touch", onTouch)
  --print("Added one pivot at "..x..","..y)
  table.insert(pivots,pivot)
  return pivot;
end

function findFilter(x,y)
  --print("Looking for filter at ", x, y)
  for n,pivot in ipairs(pivots) do
    for nn,filter in ipairs(pivot.filters) do
      local fx = filter.sceneX
      local fy = filter.sceneY
      --print("Found filter at ", fx, fy, x, y, (x==fx), (y==fy))
      if x == fx and y == fy then
        return filter
      end 
    end
  end
  return nil
end

function addLaser(x,y,col,angle)
  local laser = director:createSprite(x,y,"images/laser_"..col..".png")
  laser.xAnchor = 0.5
  laser.yAnchor = 0.5
  laser.laserColor = col
  laser.laserAngle = angle-180
  laser.sceneX = x
  laser.sceneY = y
  if angle then laser.rotation = (angle + 90) % 360 end
  table.insert(lasers,laser)
  return laser
end

function findLaser(x,y)
  for n,laser in ipairs(lasers) do
    if x == laser.sceneX and y == laser.sceneY then
      return laser
    end
  end
  return nil
end

-- Walk along the path of the laser beam.  Gather the following:
-- 1. Path of the laser as a list of x,y points
-- 2. Filters that were passed through / mirrors hit, if any
-- 3. Sensor that was hit, if any
function traceLaser(startX,startY,startAngle,startCol)
  local x = startX
  local y = startY
  local angle = startAngle
  local col = startCol
  local events = {}
  local stopped = false
  local sensor = nil
  --print("Starting laser trace at "..startX..","..startY.." angle "..startAngle.." color "..col)
  repeat
    local prevX = x
    local prevY = y
    local prevAngle = angle
    local filter = nil
    local turned = false
    repeat
      x = nearestInt(x + math.sin(math.rad(angle)) * filterGridSize)
      y = nearestInt(y + math.cos(math.rad(angle)) * filterGridSize)
      if x > director.displayWidth or x < -director.displayWidth or
         y > director.displayHeight or y < -director.displayHeight then
         --print("Laser went offscreen at "..x..","..y.." in screen size "..director.displayWidth.."x"..director.displayHeight)
         stopped = true
      else
        filter = findFilter(x, y)
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
            local vertical = prevX == x
            if normal ~= vertical then
              angle = angle + 90
            else
              angle = angle - 90
            end
            turned = true
            print("Hit mirror at ", x, y, filter.sceneOrientation, "old angle", prevAngle, "new angle", angle, col, normal, vertical)
          elseif filter.filterType == "clear" then
            -- Pass through
          elseif filter.filterType ~= col then
            --print("Hit wrong color filter at ", x, y, filter.filterType)
            stopped = true
          else
            --print("Hit same color filter at ", x, y, filter.filterType)
          end
        else
          local laser = findLaser(x,y)
          if laser then
            stopped = true
            if laser.laserColor == col then
              sensor = laser
            end
          end
        end
      end
    until stopped or turned
    table.insert(events, {filter=filter,x=x,y=y,prevX=prevX,prevY=prevY,color=startCol})
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

function fireLaser(x,y,angle,col)
  local trace = traceLaser(x,y,angle,col)
  --print("Trace returned", #trace.events, "events")
  local fullRoute = createContainer(0,0)
  --if trace.sensor then print("Trace hit a sensor") end
  for n,event in ipairs(trace.events) do
    if n <= 20 then
      --print("draw laser", event.prevX, event.prevY, event.x, event.y, event.color)
      local part = drawLaser(event.prevX, event.prevY, event.x, event.y, event.color)
      fullRoute:addChild(part)
    end
  end
  fullRoute.zOrder = -1
  fullRoute.didReachSensor = trace.sensor ~= nil
  return fullRoute
end


local gameScene = director:getCurrentScene()
gameScene:scale(0.5,0.5)
gameScene.x = director.displayCenterX/2
gameScene.y = director.displayCenterY/2
gameScene.xAnchor = 0.5
gameScene.yAnchor = 0.5

local colorLetterToWord = {
  r="red",g="green",b="blue",m="mirror"
}

function setupLevel(level)
  local rows = #level
  if rows <= 2 then
    print("Need more than 2 rows to have an actual level.  Something is wrong with this level spec")
    return false
  end
  -- Get the Y coordinate of the given row
  -- The first row is numbered 1, in lua tradition
  function rowY(n)
    return nearestInt(((rows / 2) - n) * filterGridSize + filterOffset)
  end
  local topRow = 1
  local topRowY = rowY(1)
  local bottomRow = rows
  local bottomRowY = rowY(rows)
  local columns = #(level[1])
  -- Get the X coordinate of the given column
  -- Note that the left and right columns have the emitters and the
  -- middle columns have the filters.
  -- The first column is number 1, in lua tradition
  function columnX(n)
    return nearestInt((n - (columns / 2)) * filterGridSize - filterOffset)
  end
  local leftColumn = 1
  local leftColumnX = columnX(1)
  local rightColumn = columns
  local rightColumnX = columnX(columns)
  for n = 2, #level do
    if #(level[n]) ~= columns then
      print("Columns in row "..n.." aren't the same number as the first row", n, columns, level[n])
    end
  end
  
  
  -- Add all the lasers
  local topLaserSpec = string.lower(level[1])
  for n=2, #topLaserSpec - 1 do
    local ch = topLaserSpec:sub(n,n)
    if ch ~= " " then
      local col = colorLetterToWord[ch]
      if col == "mirror" or not col then 
        print("Error: Unexpected color char", ch, "in", topLaserSpec, n)
      else
        addLaser(columnX(n), topRowY, col, 0)
      end
    end
  end
  for row = 2, #level-1 do
    local rowSpec = string.lower(level[row])
    local leftLaserCh = rowSpec:sub(1,1)
    local laserY = rowY(row)
    if leftLaserCh ~= " " then
      local col = colorLetterToWord[leftLaserCh]
      if col == "mirror" or not col then 
        print("Error: Unexpected color char", ch, "in", rowSpec, row)
      else
        addLaser(leftColumnX, laserY, col, -90)
      end
    end
    local rightLaserCh = rowSpec:sub(-1)
    if rightLaserCh ~= " " then
      local col = colorLetterToWord[rightLaserCh]
      if col == "mirror" or not col then 
        print("Error: Unexpected color char", ch, "in", rowSpec, row)
      else
        addLaser(rightColumnX, laserY, col, 90)
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
        addLaser(columnX(n), bottomRowY, col, 180)
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
      addPivot(pivotX,pivotY,tl,tr,br,bl)
    end
  end
end

setupLevel(level1)

local laserBeams = {}
function clearLasers()
  for n,beam in ipairs(laserBeams) do
    print("Removing beam", beam)
    beam = beam:removeFromParent()
    -- beam:destroy()
  end
  laserBeams = {}
end
function updateLasers()
  clearLasers()
  for n,laser in ipairs(lasers) do
    local beam = fireLaser(laser.x, laser.y, laser.laserAngle, laser.laserColor)
    print("Created beam", beam)
    table.insert(laserBeams, beam)
  end
end

system:addTimer(updateLasers, 0.1, 1, 0.1)
