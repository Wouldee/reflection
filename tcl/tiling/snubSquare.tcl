
namespace eval ::snubSquare {

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
	::grid::set scrolly_increment 2

	set maxX [expr {4*$size-1}]
	set maxY [expr {4*$size-1}]
	::grid::set max_x $maxX
	::grid::set max_y $maxY

	if {$xPixels<$yPixels} {
		set pixels $xPixels
	} else {
		set pixels $yPixels
	}
	set tile_pixels [expr {2*$pixels/(2*$size*($::Q3+1)+1)}]
	::grid::set tile_pixels $tile_pixels
	::grid::set xPixels $pixels
	::grid::set yPixels $pixels

	# populate the column/row pixel lookup
	for {set column 0} {$column<=$maxX} {incr column} {
		if {$column%2==0} {
			::grid::set column_locations $column "square"   "left"  [column_locations $column square left]
			::grid::set column_locations $column "square"   "right" [column_locations $column square right]
			::grid::set column_locations $column "triangle" "w"     [column_locations $column triangle w]
			::grid::set column_locations $column "triangle" "e"     [column_locations $column triangle e]
		} else {
			::grid::set column_locations $column "triangle" "n"     [column_locations $column triangle n]
			::grid::set column_locations $column "triangle" "s"     [column_locations $column triangle s]
		}
	}

	for {set row 0} {$row<=$maxY} {incr row} {
		if {$row%2==0} {
			::grid::set row_locations $row "square"   "left"  [row_locations $row square left]
			::grid::set row_locations $row "square"   "right" [row_locations $row square right]
			::grid::set row_locations $row "triangle" "n"     [row_locations $row triangle n]
			::grid::set row_locations $row "triangle" "s"     [row_locations $row triangle s]
		} else {
			::grid::set row_locations $row "triangle" "w"     [row_locations $row triangle w]
			::grid::set row_locations $row "triangle" "e"     [row_locations $row triangle e]
		}
	}

	# diameter of the largest circle that will fit inside a triangle
	set diameter [expr {$tile_pixels/$::Q3}]
	::grid::set node_diameter [expr {9*$diameter/10}]
	::grid::set path_width [expr {max($diameter/5,1)}]

	::triangle::new_grid
	::square::new_grid
}

proc column_locations {column shape orientation} {
	set tile_pixels [::grid::get tile_pixels]
	set xPixels [::grid::get xPixels]
	set padLeft [::grid::get pad_left]
	set padRight [::grid::get pad_right]
	set offsetx [::grid::get offsetx]

	set cell_size [expr {$tile_pixels*($::Q3+1)/2}]
	switch -- "$shape-$orientation" {
		"square-left"  -
		"square-right" -
		"triangle-n"   -
		"triangle-s"   { set column_location [expr {($column+1)*$cell_size/2}] }
		"triangle-e"   { set column_location [expr {$column*$cell_size/2 + $::Q3*$tile_pixels/2}] }
		"triangle-w"   { set column_location [expr {$column*$cell_size/2 + $tile_pixels/2}] }
	}

	if {($column_location - $xPixels + $tile_pixels*($::Q3+1)/2) > (0-$padLeft)} {
		lappend locations [expr {($column_location - $xPixels + $tile_pixels/2)+$offsetx}]
	}

	lappend locations [expr {$column_location+$offsetx}]

	if {($column_location + $xPixels - $tile_pixels*($::Q3+1)/2) < ($xPixels + $padRight)} {
		lappend locations [expr {($column_location + $xPixels - $tile_pixels/2)+$offsetx}]
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

	set cell_size [expr {$tile_pixels*($::Q3+1)/2}]
	switch -- "$shape-$orientation" {
		"square-left"  -
		"square-right" -
		"triangle-w"   -
		"triangle-e"   { set row_location [expr {($row+1)*$cell_size/2}] }
		"triangle-n"   { set row_location [expr {$row*$cell_size/2 + $tile_pixels/2}] }
		"triangle-s"   { set row_location [expr {$row*$cell_size/2 + $::Q3*$tile_pixels/2}] }
	}

	if {($row_location - $yPixels + $tile_pixels*($::Q3+1)/2) > (0-$padTop)} {
		lappend locations [expr {($row_location - $yPixels + $tile_pixels/2)+$offsety}]
	}

	lappend locations [expr {$row_location+$offsety}]

	if {($row_location + $yPixels - $tile_pixels*($::Q3+1)/2) < ($yPixels + $padBottom)} {
		lappend locations [expr {($row_location + $yPixels - $tile_pixels/2)+$offsety}]
	}

	return $locations
}

proc xPixels {yPixels size} {return $yPixels}
proc yPixels {xPixels size} {return $xPixels}

proc continuous_x {} {return 1}
proc continuous_y {} {return 1}
proc filters {} {return ""}
proc prisms {} {return 0}

proc complexity {} {
	return 2.4
}

proc tiles {size} {
	return [expr {12*$size**2}]
}

proc faces {} {
	return [expr {10.0/3.0}]
}
}

namespace eval ::snubSquare::tiling {
namespace import -force ::tiling::standard::*
namespace export *

proc shape {x y} {
	if {($x+$y)%2==0} {
		return "square"
	} else {
		return "triangle"
	}
}

proc orientation {x y} {
	switch -- [expr {($x+$y)%4}] {
		0 {	return "left" }
		2 { return "right" }
		1 { return [expr {$x%2==0} ? {"w"} : {"s"}] }
		3 { return [expr {$x%2==0} ? {"e"} : {"n"}] }
	}
}

proc tiles {} {
	return [::snubSquare::tiles [::grid::get size]]
}

proc faces {} {
	return [::snubSquare::faces]
}


# return a random integer from 0 to n-1 where n is the number of faces on the tile @ x,y
proc random_rotation {x y} {
	if {[shape $x $y]=="triangle"} {
		return [expr {int(rand()*3)}]
	} else {
		return [expr {int(rand()*4)}]
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
	switch -- "$shape-$orientation-$direction" {
		"square-left-nnw" -
		"square-right-nne" { if {[incr Y -1]<0} {set Y $maxY} }
		"square-left-nee" -
		"square-right-see" { incr X }
		"square-left-sse" -
		"square-right-ssw" { incr Y }
		"square-left-sww" -
		"square-right-nww" { if {[incr X -1]<0} {set X $maxX} }
		"triangle-w-e" { if {[incr X 2]>$maxX} {set X 0} }
		"triangle-e-w" { if {[incr X -2]<0} {set X [expr {$maxX-1}]} }
		"triangle-e-nne" -
		"triangle-w-nnw" { incr Y -1 }
		"triangle-e-sse" -
		"triangle-w-ssw" { if {[incr Y]>$maxY} {set Y 0}}
		"triangle-s-n" { if {[incr Y -2]<0} {set Y [expr {$maxY-1}]} }
		"triangle-n-s" { if {[incr Y 2]>$maxY} {set Y 0} }
		"triangle-s-see" -
		"triangle-n-nee" { if {[incr X]>$maxX} {set X 0}}
		"triangle-s-sww" -
		"triangle-n-nww" { incr X -1}
	}

	switch -- $direction {
		"n"   {set D "s" }
		"nne" {set D "ssw"}
		"nee" {set D "sww"}
		"e"   {set D "w" }
		"see" {set D "nww"}
		"sse" {set D "nnw"}
		"s"   {set D "n" }
		"ssw" {set D "nne"}
		"sww" {set D "nee"}
		"w"   {set D "e" }
		"nww" {set D "see"}
		"nnw" {set D "sse"}
	}

	return [list $X $Y $D]
}

proc random_tile {} {
	set maxX [::grid::get max_x]
	set maxY [::grid::get max_y]
	while 1 {
		set x [expr {int(rand()*($maxX+1))}]
		set y [expr {int(rand()*($maxY+1))}]
		if {$x%2==1 && $y%2==1} continue
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

	for {set x 0} {$x<=$maxX} {incr x} {
		set inc [expr {$x%2==1} ? {2} : {1}]

		for {set y 0} {$y<=$maxY} {incr y $inc} {
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

proc tile_location {x y} {
	set maxX [::grid::get max_x]
	set maxY [::grid::get max_y]
	set scrollx [::grid::get scrollx]
	set scrolly [::grid::get scrolly]

	set shape [::tile::get shape]
	set orientation [::tile::get orientation]

	# scroll
	set column [expr {($x-$scrollx)%($maxX+1)}]
	set row    [expr {($y-$scrolly)%($maxY+1)}]
	
	set xLocationList [::grid::get column_locations $column $shape $orientation]
	set yLocationList [::grid::get row_locations $row $shape $orientation]

	return [list $xLocationList $yLocationList]
}

# return a list (x y) of the tile at the given pixelx and pixely on the canvas
proc tile_at {pixelx pixely} {
	set size [::grid::get size]
	set xPixels [::grid::get xPixels]
	set yPixels [::grid::get yPixels]
	set tile_pixels [::grid::get tile_pixels]
	set offsetx [::grid::get offsetx]
	set offsety [::grid::get offsety]
	set scrollx [::grid::get scrollx]
	set scrolly [::grid::get scrolly]

	# apply offsets first
	set pixelx [expr {$pixelx-$offsetx}]
	set pixely [expr {$pixely-$offsety}]

	# check we are inside the grid
	if {$pixely<0 || $pixely>$xPixels} {return {}}
	if {$pixelx<0 || $pixelx>$yPixels} {return {}}

	set cell_size [expr {$tile_pixels*($::Q3+1)/2}]
	set column [expr {int(floor($pixelx/$cell_size))}]
	set row    [expr {int(floor($pixely/$cell_size))}]

	set column_pixel [expr {$column*$cell_size}]
	set row_pixel [expr {$row*$cell_size}]

	# determine where inside the square given by the column and row we are
	set pixelx [expr {$pixelx - $column_pixel}]
	set pixely [expr {$pixely - $row_pixel}]

	# apply scrollx & y to the column
	set column [expr {($column+$scrollx/2)%(2*$size)}]
	set row [expr {($row+$scrolly/2)%(2*$size)}]

	set x [expr {$column*2}]
	set y [expr {$row*2}]

	# height of the triangles
	set height [expr {$::Q3*$tile_pixels/2}]

	# each square contains a square tile inside, tilted to the left or right
	# the four spaces remaining are each filled by a triangle
	if {($column+$row)%2==0} {
		# square contains a left-leaning square
		if {$pixelx+$pixely*$::Q3 < $height} {
			# w-oriented triangle in the top left, y-1
			incr y -1
		} elseif {($cell_size-$pixelx)*$::Q3+$pixely < $height} {
			# s-oriented triangle in the top right, x+1
			incr x
		} elseif {($cell_size-$pixelx)+($cell_size-$pixely)*$::Q3 < $height} {
			# e-oriented triangle in the bottom right, y+1
			incr y
		} elseif {$pixelx*$::Q3+($cell_size-$pixely) < $height} {
			# n-oriented triangle in the bottom left, x-1
			incr x -1
		} else {
			# left-leaning square
		}
	} else {
		# square contains a right-leaning square
		if {($cell_size-$pixelx)+$pixely*$::Q3 < $height} {
			# e-oriented triangle in the top right, y-1
			incr y -1
		} elseif {($cell_size-$pixelx)*$::Q3+($cell_size-$pixely) < $height} {
			# n-oriented triangle in the bottom right, x+1
			incr x
		} elseif {$pixelx+($cell_size-$pixely)*$::Q3 < $height} {
			# w-oriented triangle in the bottom left, y+1
			incr y
		} elseif {$pixelx*$::Q3+$pixely < $height} {
			# s-oriented triangle in the top left, x-1
			incr x -1
		} else {
			# right-leaning square
		}
	}

	set x [expr {$x%($size*4)}]
	set y [expr {$y%($size*4)}]

	return [list $x $y]
}

proc scroll_column_locations {original_column scroll_column} {
	set locations {}
	if {$original_column%2==0} {
		lappend locations {*}[::grid::get column_locations $scroll_column square left]
		lappend locations {*}[::grid::get column_locations $scroll_column square right]
		lappend locations {*}[::grid::get column_locations $scroll_column triangle w]
		lappend locations {*}[::grid::get column_locations $scroll_column triangle e]
	} else {
		lappend locations {*}[::grid::get column_locations $scroll_column triangle n]
		lappend locations {*}[::grid::get column_locations $scroll_column triangle s]
	}
	return $locations
}

proc scroll_row_locations {original_row scroll_row} {
	set locations {}
	if {$original_row%2==0} {
		lappend locations {*}[::grid::get row_locations $scroll_row square left]
		lappend locations {*}[::grid::get row_locations $scroll_row square right]
		lappend locations {*}[::grid::get row_locations $scroll_row triangle n]
		lappend locations {*}[::grid::get row_locations $scroll_row triangle s]
	} else {
		lappend locations {*}[::grid::get row_locations $scroll_row triangle w]
		lappend locations {*}[::grid::get row_locations $scroll_row triangle e]
	}
	return $locations
}

# local procedure to make the loop easier to follow
proc redraw_column {column} {
	set maxY [::grid::get max_y]

	set x $column
	for {set y 0} {$y<=$maxY} {incr y} {
		if {$x%2==0 || $y%2==0} { ::tiling::draw_tile $x $y	}
	}
}

# local procedure to make the loop easier to follow
proc redraw_row {row} {
	set maxX [::grid::get max_x]

	set y $row
	for {set x 0} {$x<=$maxX} {incr x} {
		if {$x%2==0 || $y%2==0} { ::tiling::draw_tile $x $y }
	}
}

}