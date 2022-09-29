
namespace eval ::rhombitrihexagonal {

# called when a game is started
# calculate various constants, store them in the grid
# source the necessary tile shape(s)
proc new_grid {} {
	set size [::grid::get size]
	set offsetx [::grid::get offsetx]
	set offsety [::grid::get offsety]
	set xPixels [::grid::get xPixels]
	set yPixels [::grid::get yPixels]

	::grid::set scrollx_increment 2
	#::grid::set scrolly_increment 2

	set maxX [expr {8*$size-1}]
	set maxY [expr {4*$size-1}]
	::grid::set max_x $maxX
	::grid::set max_y $maxY

	# the tile size will be restricted by either the width or the height
	if {[xPixels $yPixels $size]<$xPixels} {
		# tile size is restricted by the screen height
		set xPixels [xPixels $yPixels $size]
		set tile_pixels [expr {2*$yPixels/(2*$size*($::Q3+3)+1)}]
	} else {
		set yPixels [yPixels $xPixels $size]
		set tile_pixels [expr {2*$xPixels/(4*$size*($::Q3+1)+$::Q3)}]
	}
	::grid::set tile_pixels $tile_pixels
	::grid::set xPixels $xPixels
	::grid::set yPixels $yPixels

	for {set column 0} {$column<=$maxX} {incr column} {
		if {$column%2==0} {
			::grid::set column_locations $column "hexagon"  "standing" [column_locations $column hexagon standing]
			::grid::set column_locations $column "square"   "straight" [column_locations $column square straight]
			::grid::set column_locations $column "triangle" "n"        [column_locations $column triangle n]
			::grid::set column_locations $column "triangle" "s"        [column_locations $column triangle s]
		} else {
			::grid::set column_locations $column "square"   "left"     [column_locations $column square left]
			::grid::set column_locations $column "square"   "right"    [column_locations $column square right]
		}
	}

	for {set row 0} {$row<=$maxY} {incr row} {
		::grid::set row_locations $row "hexagon"  "standing"  [row_locations $row hexagon standing]
		::grid::set row_locations $row "square"   "straight"  [row_locations $row square straight]
		::grid::set row_locations $row "square"   "left"      [row_locations $row square left]
		::grid::set row_locations $row "square"   "right"     [row_locations $row square right]
		::grid::set row_locations $row "triangle" "n"         [row_locations $row triangle n]
		::grid::set row_locations $row "triangle" "s"         [row_locations $row triangle s]
	}

	# diameter of the largest circle that will fit inside a triangle
	set diameter [expr {round($tile_pixels/$::Q3)}]
	::grid::set node_diameter [expr {$diameter - 5}]
	::grid::set path_width [expr {max($diameter/5,1)}]

	triangle::new_grid
	square::new_grid
	hexagon::new_grid
}

proc xPixels {yPixels size} {return [expr {$yPixels*(4*$size*($::Q3+1)+$::Q3)/(2*$size*($::Q3+3)+1)}]}
proc yPixels {xPixels size} {return [expr {$xPixels*(2*$size*($::Q3+3)+1)/(4*$size*($::Q3+1)+$::Q3)}]}

proc column_locations {column shape orientation} {
	set tile_pixels [::grid::get tile_pixels]
	set xPixels [::grid::get xPixels]
	set padLeft [::grid::get pad_left]
	set padRight [::grid::get pad_right]
	set offsetx [::grid::get offsetx]

	set column_width [expr {$tile_pixels*($::Q3 + 1)/4}]
	set column_location [expr {$column*$column_width + $::Q3*$tile_pixels/2}]

	if {($column_location - $xPixels + $tile_pixels*$::Q3) > (0-$padLeft)} {
		lappend locations [expr {($column_location - $xPixels + $::Q3*$tile_pixels/2)+$offsetx}]
	}

	lappend locations [expr {$column_location+$offsetx}]

	if {($column_location + $xPixels - $tile_pixels*$::Q3) < ($xPixels + $padRight)} {
		lappend locations [expr {($column_location + $xPixels - $::Q3*$tile_pixels/2)+$offsetx}]
	}

	return $locations
}

proc row_locations {row shape orientation} {
	set tile_pixels [::grid::get tile_pixels]
	set yPixels [::grid::get yPixels]
	set padTop [::grid::get pad_top]
	set padBottom [::grid::get pad_bottom]
	set offsety [::grid::get offsety]
	set continuous [::grid::get continuous_x]

	set row_height [expr {$tile_pixels*($::Q3+3)/4}]
	switch -- "$shape-$orientation" {
		"hexagon-standing" -
		"square-straight"  -
		"square-left"      -
		"square-right"     { set row_location [expr {$row*$row_height + $tile_pixels}] }
		"triangle-n"       { set row_location [expr {($row-1)*$row_height + 2*$tile_pixels}] }
		"triangle-s"       { set row_location [expr {($row+1)*$row_height}] }
	}

	if {$continuous && ($row_location - $yPixels + 3*$tile_pixels/2) > (0-$padTop)} {
		lappend locations [expr {($row_location - $yPixels + $tile_pixels/2)+$offsety}]
	}

	lappend locations [expr {$row_location+$offsety}]

	if {$continuous && ($row_location + $yPixels - 3*$tile_pixels/2) < ($yPixels + $padBottom)} {
		lappend locations [expr {($row_location + $yPixels - $tile_pixels/2)+$offsety}]
	}

	return $locations
}

proc continuous_x {} {return 1}
proc continuous_y {} {return 1}
proc filters {} {return ""}
proc prisms {} {return ""}

proc complexity {} {
	return 3.25
}

proc tiles {size} {
	return [expr {24*$size**2}]
}

proc faces {} {
	return 4.0
}

}

namespace eval ::rhombitrihexagonal::tiling {
namespace import -force ::tiling::standard::*
namespace export *

proc shape {x y} {
	if {$x%2==1 || ($x+$y)%4==2} {
		return "square"
	} elseif {($x+$y)%4==0} {
		return "hexagon"
	} else {
		return "triangle"
	}
}

proc orientation {x y} {
	set shape [shape $x $y]

	if {$shape=="square"} {
		if {$y%2==0} {
			return "straight"
		} elseif {($x-$y)%4==0} {
			return "left"
		} else {
			return "right"
		}
	} elseif {$shape=="triangle"} {
		if {($x+$y)%4==1} {
			return "n"
		} else {
			return "s"
		}
	} else {
		return "standing"
	}
}

proc tiles {} {
	return [::rhombitrihexagonal::tiles [::grid::get size]]
}

proc faces {} {
	return [::rhombitrihexagonal::faces]
}

# return a random integer from 0 to n-1 where n is the number of faces on the tile @ x,y
proc random_rotation {x y} {
	switch -- [shape $x $y] {
		"triangle" { return [expr {int(rand()*3)}] }
		"square" { return [expr {int(rand()*4)}] }
		"hexagon" { return [expr {int(rand()*6)}] }
	}
}

# return a list containing the x y face of the tile facing the tile @ x,y in the given direction
proc neighbour {x y direction} {
	set maxX [::grid::get max_x]
	set maxY [::grid::get max_y]

	set shape [shape $x $y]
	set orientation [orientation $x $y]

	set X $x
	set Y $y
	switch -- $direction {
		"n" {
			set D "s"
			# straight square or s triangle
			# decrement y
			# square may be on the edge
			if {[incr Y -1]<0} {set Y $maxY}
		}
		"nne" {
			set D "ssw"
			# hexagon or right square: increment x, decrement y
			# square may be on the x edge
			# hexagon may be on the y edge
			if {[incr X]>$maxX} {set X 0}
			if {[incr Y -1]<0} {set Y $maxY}
		}
		"nee" {
			set D "sww"
			# left square or n triangle: increment x
			# square may be on the x edge 
			if {[incr X]>$maxX} {set X 0}
		}
		"e" {
			set D "w"
			# straight square or hexagon
			# increment x by 2
			# may be the edge
			if {[incr X 2]>$maxX} {set X 0}
		}
		"see" {
			set D "nww"
			# right square or n triangle: increment x
			# square may be on the x edge
			if {[incr X]>$maxX} {set X 0}
		}
		"sse" {
			set D "nnw"
			# hexagon or left square: increment x, increment y
			# square may be on the x edge
			# square may be on the y edge
			if {[incr X]>$maxX} {set X 0}
			if {[incr Y]>$maxY} {set Y 0}
		}
		"s" {
			set D "n"
			# straight square or n triangle
			# inrement y
			# triangle may be on the edge
			if {[incr Y]>$maxY} {set Y 0}
		}
		"ssw" {
			set D "nne"
			# hexagon or right square: decrement x, increment y
			# hexagon may be on the x edge
			# right square may be on the y edge
			if {[incr X -1]<0} {set X $maxX}
			if {[incr Y]>$maxY} {set Y 0}
		}
		"sww" {
			set D "nee"
			# right square or s triangle: decrement x
			# triangle may be on the x edge
			if {[incr X -1]<0} {set X $maxX}
		}
		"w" {
			set D "e"
			# straight square or hexagon
			# decrement x by 2
			# may be the edge
			if {[incr X -2]<0} {set X [expr {$maxX-1}]}
		}
		"nww" {
			set D "see"
			# right square or n triangle: decrement x
			# triangle may be on the x edge
			if {[incr X -1]<0} {set X $maxX}
		}
		"nnw" {
			set D "sse"
			# hexagon or right square: decrement x, decrement y
			# hexagon may be on the x edge
			# hexagon may be on the y edge
			if {[incr X -1]<0} {set X $maxX}
			if {[incr Y -1]<0} {set Y $maxY}
		}
	}

	return [list $X $Y $D]
}

proc random_tile {} {
	set maxX [::grid::get max_x]
	set maxY [::grid::get max_y]
	while 1 {
		set x [expr {int(rand()*($maxX+1))}]
		set y [expr {int(rand()*($maxY+1))}]
		if {$x%2==1 && $y%2==0} continue
		break
	}

	return [list $x $y]
}

# perform the given action for every tile on the grid
# xname and yname are the names of local variables in the caller's context
# xname and yname will be populated with the x and y of the current tile
# behaves just like a for loop
proc each_tile {xname yname action} {
	upvar $xname x
	upvar $yname y

	set maxX [::grid::get max_x]
	set maxY [::grid::get max_y]

	for {set y 0} {$y<=$maxY} {incr y} {

		set inc [expr {$y%2==1} ? {1} : {2}]
		for {set x 0} {$x<=$maxX} {incr x $inc} {
			# evaluate the action
			::set code [catch { uplevel 1 $action } msg]
			switch -- $code {
				0 { }
				1 { return -code error \
							-errorinfo $::errorInfo \
							-errorcode $::errorCode $msg }
				2 { return -code return $msg }
				3 { return {} }
				4 { }
				default { return -code $code $msg }
			}
		}
	}
}

# return the on-screen x,y of the tile
# for triangles, this is the point of the triangle
# for hexagons this is the centre
proc tile_location {x y} {
	set maxX [::grid::get max_x]
	set maxY [::grid::get max_y]
	set scrollx [::grid::get scrollx]
	set scrolly [::grid::get scrolly]

	set column [expr {($x-$scrollx)%($maxX+1)}]
	set row [expr {($y-$scrolly)%($maxY+1)}]
	set shape [::tile::get shape]
	set orientation [::tile::get orientation]

	set xLocationList [::grid::get column_locations $column $shape $orientation]
	set yLocationList [::grid::get row_locations $row $shape $orientation]

	return [list $xLocationList $yLocationList]
}

# return a list (x y) of the tile at the given pixelx and pixely on the canvas
proc tile_at {pixelx pixely} {
	set size [::grid::get size]
	set maxX [::grid::get max_x]
	set maxY [::grid::get max_y]
	set tile_pixels [::grid::get tile_pixels]
	set xPixels [::grid::get xPixels]
	set yPixels [::grid::get yPixels]
	set offsetx [::grid::get offsetx]
	set offsety [::grid::get offsety]
	set scrollx [::grid::get scrollx]
	set scrolly [::grid::get scrolly]

	# apply offsets first
	set pixelx [expr {$pixelx-$offsetx}]
	set pixely [expr {$pixely-$offsety}]

	# check we are inside the grid
	if {$pixely<0 || $pixely>$yPixels} {return {}}
	if {$pixelx<0 || $pixelx>$xPixels} {return {}}

	# divide the grid into triangles, defined by tx, ty and tz
	set triangle_size [expr {$tile_pixels*($::Q3+1)/$::Q3}]
	set triangle_height [expr {$tile_pixels*($::Q3+1)/2}]

	# tx is which column, ty is how far from the top left corner on a 30-degree angle to the vertical
	# tz is how far from the top right corner on a 30-degree angle to the vertical
	set triangle_pixelx [expr {$pixelx+$tile_pixels/2}]							; # horizontal offset of triangles
	set triangle_pixelx [expr {$triangle_pixelx + $scrollx*$triangle_height/2}]	; # apply horizontal scroll
	set triangle_x [expr {int(floor($triangle_pixelx/$triangle_height))}] 	; # x-coordinate of triangle

	set triangle_pixely [expr {$pixely+$pixelx/$::Q3}]							; # x is divided by root 3
	set triangle_pixely [expr {$triangle_pixely + $tile_pixels*(2-$::Q3)/(2*$::Q3)}]	; # offset
	set triangle_pixely [expr {$triangle_pixely + 0.75*$scrolly*$triangle_size}]	; # apply vertical scroll
	set triangle_pixely [expr {$triangle_pixely + $scrollx*$triangle_size/4}]		; # apply horizontal scroll
	set triangle_y [expr {int(floor($triangle_pixely/$triangle_size))}]	; # y-coordinate of triangle

	set triangle_pixelz [expr {$pixely+($xPixels-$pixelx)/$::Q3}]				; # x is measured from the right
	set triangle_pixelz [expr {$triangle_pixelz + $tile_pixels/$::Q3}]			; # offset
	set triangle_pixelz [expr {$triangle_pixelz + 0.75*$scrolly*$triangle_size}] ; # vertical scroll
	set triangle_pixelz [expr {$triangle_pixelz - $scrollx*$triangle_size/4}]		; # horixontal scroll (from the right)
	set triangle_z [expr {int(floor($triangle_pixelz/$triangle_size))}]	; # z-coordinate of triangle
#logToFile "triangle @ $triangle_x,$triangle_y,$triangle_z"

	# now find the x y of the hexagon that the triangle is a part of
	# and which sector of that hexagon
	set y [expr {(2*(($triangle_y+$triangle_z-2*$size)/3))%($maxY+1)}]
	if {$y%4==0} {
		set sector "[expr {($triangle_x%2)==1}]-[expr {($triangle_y+$triangle_z-2*$size)%3}]"
		set x [expr {(4*($triangle_x/2))%($maxX+1)}]
	} else {
		set sector "[expr {($triangle_x%2)==0}]-[expr {($triangle_y+$triangle_z-2*$size)%3}]"
		set x [expr {(4*(($triangle_x-1)/2)+2)%($maxX+1)}]
	}

	# get the centre of the hexagon
	lassign [tile_location $x $y] xLocationList ylocationList
	set hPixelx ""
	foreach xLocation $xLocationList {
#		logToFile "hpixelx=$hPixelx; is $pixelx closer to $xLocation?"
		if {$hPixelx=="" || abs(($pixelx+$offsetx)-$xLocation)<abs(($pixelx+$offsetx)-$hPixelx)} { set hPixelx $xLocation }
	}
	set hPixely ""
	foreach yLocation $ylocationList {
#		logToFile "hpixely=$hPixely; is $pixely closer to $yLocation?"
		if {$hPixely=="" || abs(($pixely+$offsety)-$yLocation)<abs(($pixely+$offsety)-$hPixely)} { set hPixely $yLocation }
	}

	set hPixelx [expr {$hPixelx-$offsetx}]
	set hPixely [expr {$hPixely-$offsety}]

#	logToFile "hexagon is $x,$y @ $hPixelx,$hPixely"

	# determine triangle-specific pixels
	set pixelx [expr {$pixelx-$hPixelx}]
	set pixely [expr {$pixely-$hPixely}]

	# each triangle contains 1/6 of a hexagon, 1/2 of a square and 1/6 of two different triangles
	# there are 6 distinct orientations of the triangles
	switch -- $sector {
		"0-0" {
			# nw
			if {$pixely+$pixelx/$::Q3<(0-$tile_pixels)} {
				# not the hexagon
				incr y -1
				if {$pixely-$::Q3*$pixelx>$tile_pixels} {
					# n triangle
					incr x -2
				} elseif {$pixely-$::Q3*$pixelx<(0-$tile_pixels)} {
					# s triangle
				} else {
					# left square
					incr x -1
				}
			}
		}
		"0-1" {
			# w
			if {$pixelx<(0-$::Q3*$tile_pixels/2)} {
				# not the hexagon
				incr x -2
				if {$pixely<(0-$tile_pixels/2)} {
					# n triangle
					incr y -1
				} elseif {$pixely>$tile_pixels/2} {
					# s triangle
					incr y
				} else {
					# left square
				}
			}
		}
		"0-2" {
			# sw
			if {$pixely-$pixelx/$::Q3>$tile_pixels} {
				# not the hexagon
				incr y
				if {$pixely+$::Q3*$pixelx>$tile_pixels} {
					# n triangle
				} elseif {$pixely+$::Q3*$pixelx<(0-$tile_pixels)} {
					# s triangle
					incr x -2
				} else {
					# left square
					incr x -1
				}
			}
		}
		"1-0" {
			# ne
			if {$pixely-$pixelx/$::Q3<(0-$tile_pixels)} {
				# not the hexagon
				incr y -1
				if {$pixely+$::Q3*$pixelx>$tile_pixels} {
					# n triangle
					incr x 2
				} elseif {$pixely+$::Q3*$pixelx<(0-$tile_pixels)} {
					# s triangle
				} else {
					# left square
					incr x
				}
			}
		}
		"1-1" {
			# e
			if {$pixelx>$::Q3*$tile_pixels/2} {
				# not the hexagon
				incr x 2
				if {$pixely<(0-$tile_pixels/2)} {
					# n triangle
					incr y -1
				} elseif {$pixely>$tile_pixels/2} {
					# s triangle
					incr y
				} else {
					# left square
				}
			}
		}
		"1-2" {
			# se
			if {$pixely+$pixelx/$::Q3>$tile_pixels} {
				# not the hexagon
				incr y
				if {$pixely-$::Q3*$pixelx>$tile_pixels} {
					# n triangle
				} elseif {$pixely-$::Q3*$pixelx<(0-$tile_pixels)} {
					# s triangle
					incr x 2
				} else {
					# left square
					incr x
				}
			}
		}
	}

	set x [expr {$x%($maxX+1)}]
	set y [expr {$y%($maxY+1)}]

	return [list $x $y]
}

proc scroll_column_locations {original_column scroll_column} {
	set locations {}
	if {$original_column%2==0} {
		lappend locations {*}[::grid::get column_locations $scroll_column hexagon standing]
		lappend locations {*}[::grid::get column_locations $scroll_column square straight]
		lappend locations {*}[::grid::get column_locations $scroll_column triangle n]
		lappend locations {*}[::grid::get column_locations $scroll_column triangle s]
	} else {
		lappend locations {*}[::grid::get column_locations $scroll_column square left]
		lappend locations {*}[::grid::get column_locations $scroll_column square right]
	}
	return $locations
}

proc scroll_row_locations {original_row scroll_row} {
	set locations {}
	lappend locations {*}[::grid::get row_locations $scroll_row hexagon standing]
	lappend locations {*}[::grid::get row_locations $scroll_row square straight]
	lappend locations {*}[::grid::get row_locations $scroll_row square left]
	lappend locations {*}[::grid::get row_locations $scroll_row square right]
	lappend locations {*}[::grid::get row_locations $scroll_row triangle n]
	lappend locations {*}[::grid::get row_locations $scroll_row triangle s]
	return $locations
}

# redraw a column of the grid
proc redraw_column {column} {
	set maxY [::grid::get max_y]

	set x $column
	for {set y 0} {$y<=$maxY} {incr y} {
		if {$y%2==1 || $x%2==0} {
			::tiling::draw_tile $x $y
		}
	}
}

# now redraw any tiles that have moved off the edge of the grid
# local procedure to make the loop easier to follow
proc redraw_row {row} {
	set maxX [::grid::get max_x]

	set y $row
	for {set x 0} {$x<=$maxX} {incr x} {
		if {$y%2==1 || $x%2==0} {
			::tiling::draw_tile $x $y
		}
	}
}

}