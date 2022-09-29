
namespace eval ::trihexagonal {

# called when a game is started
# calculate various constants, store them in the grid
# source the necessary tile shape(s)

proc new_grid {} {
	set size [::grid::get size]
	set offsetx [::grid::get offsetx]
	set offsety [::grid::get offsety]
	set xPixels [::grid::get xPixels]
	set yPixels [::grid::get yPixels]

	set maxX [expr {4*$size-1}]
	set maxY [expr {4*$size-1}]
	::grid::set max_x $maxX
	::grid::set max_y $maxY

	# the tile size will be restricted by either the width or the height
	if {[xPixels $yPixels $size]<$xPixels} {
		# tile size is restricted by the screen height
		set xPixels [xPixels $yPixels $size]
		set tile_pixels [expr {$yPixels/(2*$::Q3*$size)}]
	} else {
		set yPixels [yPixels $xPixels $size]
		set tile_pixels [expr {$xPixels/(4*$size+1)}]
	}
	::grid::set yPixels $yPixels
	::grid::set xPixels $xPixels
	::grid::set tile_pixels $tile_pixels

	# diameter of the largest circle that will fit inside a triangle
	set diameter [expr {round($tile_pixels/$::Q3)}]
	set path_width [expr {max($diameter/5,1)}]
	set node_diameter [expr {$diameter - $path_width}]

	::grid::set path_width $path_width
	::grid::set node_diameter $node_diameter

	for {set column 0} {$column<=$maxX} {incr column} {
		::grid::set column_locations $column [column_locations $column]
	}

	for {set row 0} {$row<=$maxY} {incr row} {
		::grid::set row_locations $row hexagon flat [row_locations $row hexagon flat]
		::grid::set row_locations $row triangle n [row_locations $row triangle n]
		::grid::set row_locations $row triangle s [row_locations $row triangle s]
	}

	::triangle::new_grid
	::hexagon::new_grid
}

proc xPixels {yPixels size} {return [expr {$yPixels*(4*$size+1)/(2*$::Q3*$size)}]}
proc yPixels {xPixels size} {return [expr {2*$xPixels*$::Q3*$size/(4*$size+1)}]}

proc column_locations {column} {
	set tile_pixels [::grid::get tile_pixels]
	set xPixels [::grid::get xPixels]
	set padLeft [::grid::get pad_left]
	set padRight [::grid::get pad_right]
	set offsetx [::grid::get offsetx]

	set column_centre [expr {$tile_pixels*($column+1)}]
	set locations {}

	if {($column_centre - $xPixels + 2*$tile_pixels) > (0-$padLeft)} {
		lappend locations [expr {($column_centre - $xPixels + $tile_pixels)+$offsetx}]
	}

	lappend locations [expr {$column_centre+$offsetx}]

	if {($column_centre + $xPixels - 2*$tile_pixels) < ($xPixels + $padRight)} {
		lappend locations [expr {($column_centre + $xPixels - $tile_pixels)+$offsetx}]
	}

	return $locations
}

proc row_locations {row shape orientation} {
	set tile_pixels [::grid::get tile_pixels]
	set yPixels [::grid::get yPixels]
	set padTop [::grid::get pad_top]
	set padBottom [::grid::get pad_bottom]
	set offsety [::grid::get offsety]
	set maxY [::grid::get max_y]
	set continuous [::grid::get continuous_y]

	switch -- "$shape-$orientation" {
		"hexagon-flat" { set row_centre [expr {$::Q3*$tile_pixels*$row/2}] }
		"triangle-n" { set row_centre [expr {$::Q3*$tile_pixels*(($row-1)%($maxY+1))/2}] }
		"triangle-s" { set row_centre [expr {$::Q3*$tile_pixels*($row+1)/2}] }
	}

	set locations {}

	if {$continuous && ($row_centre - $yPixels + $::Q3*$tile_pixels/2) > (0-$padTop)} {
		lappend locations [expr {($row_centre - $yPixels)+$offsety}]
	}

	lappend locations [expr {$row_centre+$offsety}]

	if {$continuous && ($row_centre + $yPixels - $::Q3*$tile_pixels/2) < ($yPixels + $padBottom)} {
		lappend locations [expr {($row_centre + $yPixels)+$offsety}]
	}

	return $locations
}

proc continuous_x {} {return 1}
proc continuous_y {} {return ""}
proc filters {} {return ""}
proc prisms {} {return ""}

proc tiles {size} {
	return [expr {12*$size**2}]
}

proc faces {} {
	return 4.0
}

proc complexity {} {
	return 3.5
}

}

namespace eval ::trihexagonal::tiling {
namespace import -force ::tiling::standard::*
namespace export *

proc shape {x y} {
	if {$y%2==0} {
		return "triangle"
	} else {
		return "hexagon"
	}
}

proc orientation {x y} {
	if {[shape $x $y]=="hexagon"} {
		return "flat"
	} elseif {($x+$y/2)%2==0} {
		return "n"
	} else {
		return "s"
	}
}

proc tiles {} {
	return [::trihexagonal::tiles [::grid::get size]]
}

proc faces {} {
	return [::trihexagonal::faces]
}

# return a random integer from 0 to n-1 where n is the number of faces on the tile @ x,y
proc random_rotation {x y} {
	if {[shape $x $y]=="triangle"} {
		return [expr {int(rand()*3)}]
	} else {
		return [expr {int(rand()*6)}]
	}
}

# return a list containing the x y face of the tile facing the tile @ x,y in the given direction
proc neighbour {x y direction} {
	set maxX [::grid::get max_x]
	set maxY [::grid::get max_y]
	# always continuous horizontally
	set continuous [::grid::get continuous_y]

	set shape [shape $x $y]

	set X $x
	set Y $y
	switch -- $direction {
		"n" {
			set D "s"
			if {[incr Y -1]<0} {set Y $maxY}
			# the northward pointing triangles in row 0 are actually at the bottom of the screen so
			if {!$continuous && ($Y==0 || $Y==$maxY)} {return {}}
		}
		"nee" {
			set D "sww"
			if {[incr X]>$maxX} {set X 0}
			if {[incr Y -1]<0} {set Y $maxY}
		}
		"see" {
			set D "nww"
			if {[incr X]>$maxX} {set X 0}
			if {[incr Y]>$maxY} {set Y 0}
		}
		"s" {
			set D "n"
			if {[incr Y]>$maxY} {set Y 0}
			# the northward pointing triangles in row 0 are actually at the bottom of the screen so
			if {!$continuous && ($Y==0 || $Y==1)} {return {}}
		}
		"sww" {
			set D "nee"
			if {[incr X -1]<0} {set X $maxX}
			if {[incr Y]>$maxY} {set Y 0}
		}
		"nww" {
			set D "see"
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
		if {($x%2==1 && $y%4==1) || ($x%2==0 && $y%4==3)} { continue }
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
		set init [expr {$y%4==3} ? {1} : {0}]
		set inc  [expr {$y%2==0} ? {1} : {2}]

		for {set x $init} {$x<=$maxX} {incr x $inc} {
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

	set xPixelList [::grid::get column_locations $column]
	set yPixelList [::grid::get row_locations $row $shape $orientation]

	return [list $xPixelList $yPixelList]
}

# return a list (x y) of the tile at the given pixelx and pixely on the canvas
proc tile_at {pixelx pixely} {
	set size [::grid::get size]
	set tile_pixels [::grid::get tile_pixels]
	set xPixels [::grid::get xPixels]
	set yPixels [::grid::get yPixels]
	set offsetx [::grid::get offsetx]
	set offsety [::grid::get offsety]
	set scrollx [::grid::get scrollx]
	set scrolly [::grid::get scrolly]
	set maxX [::grid::get max_x]
	set maxY [::grid::get max_y]

	# apply offsets first
	set pixelx [expr {$pixelx-$offsetx}]
	set pixely [expr {$pixely-$offsety}]

	# check we are inside the grid
	if {$pixely<0 || $pixely>$yPixels} {return {}}
	if {$pixelx<0 || $pixelx>$xPixels} {return {}}

	# divide the grid into equilateral triangles
	# each triangle has an x,y and z location
	# each hexagon tile is composed of 6 of these triangles
	# each triangle tile is exactly one of these triangles
	# x is how far from the top left corner
	# y is just vertical distance as usual
	# z is how far from the top right corner
	# z & x need to be offset if vertical scroll is even
	if {$scrolly%2==0} {
		set offset [expr {$tile_pixels/2}]
	} else {
		set offset 0
	}
	set triangle_x [expr {int(floor(($pixelx + $pixely/$::Q3 - $offset)/$tile_pixels))}]
	set triangle_y [expr {int(floor((2*$pixely)/($::Q3*$tile_pixels)))}]
	set triangle_z [expr {int(floor((($xPixels-$pixelx) + $pixely/$::Q3 - $offset)/$tile_pixels))}]

	# apply scroll to the triangles
	# vertical scroll affects x & z as well as y
	# horizontal scroll has the reverse effect on z
	set triangle_x [expr {$triangle_x + $scrollx + $scrolly/2}]
	set triangle_y [expr {$triangle_y + $scrolly}]
	set triangle_z [expr {$triangle_z - $scrollx + $scrolly/2}]

	if {$triangle_x%2==0 && $triangle_y%2==1 && $triangle_z%2==1} {
		# n-triangle
		set x [expr {$triangle_x - ($triangle_y+1)/2}]
		set y [expr {$triangle_y+1}]
	} elseif {$triangle_x%2==1 && $triangle_y%2==0 && $triangle_z%2==0} {
		# s-triangle
		set x [expr {$triangle_x - $triangle_y/2}]
		set y $triangle_y
	} else {
		#hexagon
		set y [expr {$triangle_y%2==0} ? {$triangle_y+1} : {$triangle_y}]
		if {$y%4==1} {
			set x [expr {2*((2*$triangle_x - $triangle_y + 1)/4)}]
		} else {
			set x [expr {2*((2*$triangle_x - $triangle_y - 1)/4) + 1}]
		}
	}

	set x [expr {$x%($maxX+1)}]
	set y [expr {$y%($maxY+1)}]

	return [list $x $y]
}

proc scroll_column_locations {original_column scroll_column} {
	return [::grid::get column_locations $scroll_column]
}

proc scroll_row_locations {original_row scroll_row} {
	if {$original_row%2==0} {
		set locations [::grid::get row_locations $scroll_row triangle n]
		lappend locations {*}[::grid::get row_locations $scroll_row triangle s]
		return $locations
	} else {
		return [::grid::get row_locations $scroll_row hexagon flat]
	}
}

# redraw a column
proc redraw_column {column} {
	set maxY [::grid::get max_y]

	set x $column
	for {set y 0} {$y<=$maxY} {incr y} {
		if {$x%2==0 && $y%4==3} { continue }
		if {$x%2==1 && $y%4==1} { continue }
		draw_tile $x $y
	}
}

# local procedure to make the loop easier to follow
proc redraw_row {row} {
	set maxX [::grid::get max_x]

	set y $row
	for {set x 0} {$x<=$maxX} {incr x} {
		if {$x%2==0 && $y%4==3} { continue }
		if {$x%2==1 && $y%4==1} { continue }
		draw_tile $x $y
	}
}

}