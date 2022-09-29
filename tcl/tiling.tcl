

source tiling/template.tcl
source tiling/triangular.tcl
source tiling/squares.tcl
source tiling/elongatedTriangular.tcl
source tiling/snubSquare.tcl
source tiling/hexagonal.tcl
source tiling/trihexagonal.tcl
source tiling/rhombitrihexagonal.tcl
source tiling/truncatedSquare.tcl

source shape/triangle.tcl
source shape/square.tcl
source shape/hexagon.tcl
source shape/octagon.tcl

namespace eval ::tiling {

# called when a game is started
# calculate various constants, store them in the grid
# source the necessary tile shape(s)
proc new_grid {tiling} {

	set rectangle_id [::grid::get border_id]
	lassign [[screen] coords $rectangle_id] x1 y1 x2 y2

	set x0 0
	set y0 0
	set geometry [wm geometry .]
	scan $geometry "%dx%d+%d+%d" x3 y3 xx yy

	set pad_left [expr {$x1-$x0}]
	set pad_right [expr {$x3-$x2}]
	set pad_top [expr {$y1-$y0}]
	set pad_bottom [expr {$y3-$y2}]

	# for now, set pad_left to = pad_right....
	# should take into account the size of the game panel instead...
	set pad_left $pad_right

	::grid::set pad_left $pad_left
	::grid::set pad_right $pad_right
	::grid::set pad_top $pad_top
	::grid::set pad_bottom $pad_bottom

	set offsetx [expr {int(min($x1,$x2))}]
	set offsety [expr {int(min($y1,$y2))}]
	::grid::set offsetx $offsetx
	::grid::set offsety $offsety

	set xPixels [expr {double(abs($x1-$x2))}]
	set yPixels [expr {double(abs($y1-$y2))}]
	::grid::set xPixels $xPixels
	::grid::set yPixels $yPixels

	set scrollx_increment 1
	set scrolly_increment 1
	::grid::set scrollx_increment $scrollx_increment
	::grid::set scrolly_increment $scrolly_increment

	#namespace import -force ::tiling::standard::*
	namespace import -force ::${tiling}::tiling::*

	::${tiling}::new_grid
}

proc new_tile {x y} {}
proc tiles {} {}
proc faces {} {}
proc shape {x y} {}
proc orientation {x y} {}
proc directions {x y} {}
proc next_direction {x y direction} {}
proc random_direction {x y} {}
proc rotate_arm {x y arm by} {}
proc add_arm_connector_type {x y link_id arm} {}
proc remove_arm_connector_type {x y link_id arm} {}
proc add_link_connector_type {x y link} {}
proc remove_link_connector_type {x y link} {}
proc connector_to_prism {x y} {}
proc random_rotation {x y} {}
proc neighbour {x y direction} {}
proc random_tile {} {}
proc each_tile {xname yname action} {}
proc tile_location {x y} {}
proc tile_at {pixelx pixely} {}
proc scrollx {amount} {}
proc scrolly {amount} {}
proc update_tile {x y} {}
proc finalise_tile {x y} {}
proc draw_tile {x y} {}
proc redraw_links {x y} {}

}
