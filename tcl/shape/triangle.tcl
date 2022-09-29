
namespace eval ::triangle {

proc new_grid {} {
	variable faces
	variable points
	variable face {}
	variable point {}
	variable coordinate {}

	set faces(n)  {nww nee s}
	set faces(e)  {nne sse w}
	set faces(s)  {see sww n}
	set faces(w)  {ssw nnw e}
	set points(n) {n see sww}
	set points(e) {e ssw nnw}
	set points(s) {s nww nee}
	set points(w) {w nne sse}

	foreach orientation {n e s w} {
		set count 0
		foreach fromFace $faces($orientation) {
			set rotation 0
			while {$rotation<3} {
				set index [expr {($count+$rotation)%3}]
				set toFace [lindex $faces($orientation) $index]
				set toPoint [lindex $points($orientation) $index]
				dict set face $orientation $fromFace $rotation $toFace

				incr rotation
				dict set point $orientation $fromFace $rotation $toPoint
			}
			incr count
		}
	}

	set size [::grid::get tile_pixels]
	dict set coordinate n "centre"    x 0
	dict set coordinate n "centre"    y [expr {0 + $size/$::Q3}]
	dict set coordinate n "n point"   x 0
	dict set coordinate n "n point"   y 0
	dict set coordinate n "nee face"  x [expr {0 + $size/4}]
	dict set coordinate n "nee face"  y [expr {0 + $::Q3*$size/4}]
	dict set coordinate n "see point" x [expr {0 + $size/2}]
	dict set coordinate n "see point" y [expr {0 + $::Q3*$size/2}]
	dict set coordinate n "s face"    x 0
	dict set coordinate n "s face"    y [expr {0 + $::Q3*$size/2}]
	dict set coordinate n "sww point" x [expr {0 - $size/2}]
	dict set coordinate n "sww point" y [expr {0 + $::Q3*$size/2}]
	dict set coordinate n "nww face"  x [expr {0 - $size/4}]
	dict set coordinate n "nww face"  y [expr {0 + $::Q3*$size/4}]

	dict set coordinate e "centre"    x [expr {0 - $size/$::Q3}]
	dict set coordinate e "centre"    y 0
	dict set coordinate e "e point"   x 0
	dict set coordinate e "e point"   y 0
	dict set coordinate e "sse face"  x [expr {0 - $::Q3*$size/4}]
	dict set coordinate e "sse face"  y [expr {0 + $size/4}]
	dict set coordinate e "ssw point" x [expr {0 - $::Q3*$size/2}]
	dict set coordinate e "ssw point" y [expr {0 + $size/2}]
	dict set coordinate e "w face"    x [expr {0 - $::Q3*$size/2}]
	dict set coordinate e "w face"    y 0
	dict set coordinate e "nnw point" x [expr {0 - $::Q3*$size/2}]
	dict set coordinate e "nnw point" y [expr {0 - $size/2}]
	dict set coordinate e "nne face"  x [expr {0 - $::Q3*$size/4}]
	dict set coordinate e "nne face"  y [expr {0 - $size/4}]

	dict set coordinate s "centre"    x 0
	dict set coordinate s "centre"    y [expr {0 - $size/$::Q3}]
	dict set coordinate s "s point"   x 0
	dict set coordinate s "s point"   y 0
	dict set coordinate s "sww face"  x [expr {0 - $size/4}]
	dict set coordinate s "sww face"  y [expr {0 - $::Q3*$size/4}]
	dict set coordinate s "nww point" x [expr {0 - $size/2}]
	dict set coordinate s "nww point" y [expr {0 - $::Q3*$size/2}]
	dict set coordinate s "n face"    x 0
	dict set coordinate s "n face"    y [expr {0 - $::Q3*$size/2}]
	dict set coordinate s "nee point" x [expr {0 + $size/2}]
	dict set coordinate s "nee point" y [expr {0 - $::Q3*$size/2}]
	dict set coordinate s "see face"  x [expr {0 + $size/4}]
	dict set coordinate s "see face"  y [expr {0 - $::Q3*$size/4}]

	dict set coordinate w "centre"    x [expr {0 + $size/$::Q3}]
	dict set coordinate w "centre"    y 0
	dict set coordinate w "w point"   x 0
	dict set coordinate w "w point"   y 0
	dict set coordinate w "nnw face"  x [expr {0 + $::Q3*$size/4}]
	dict set coordinate w "nnw face"  y [expr {0 - $size/4}]
	dict set coordinate w "nne point" x [expr {0 + $::Q3*$size/2}]
	dict set coordinate w "nne point" y [expr {0 - $size/2}]
	dict set coordinate w "e face"    x [expr {0 + $::Q3*$size/2}]
	dict set coordinate w "e face"    y 0
	dict set coordinate w "sse point" x [expr {0 + $::Q3*$size/2}]
	dict set coordinate w "sse point" y [expr {0 + $size/2}]
	dict set coordinate w "ssw face"  x [expr {0 + $::Q3*$size/4}]
	dict set coordinate w "ssw face"  y [expr {0 + $size/4}]
}

proc face {orientation from by} {
	variable face

	if {![dict exists $face $orientation $from $by]} { return $from }

	return [dict get $face $orientation $from $by]
}

proc point {orientation from by} {
	variable point

	if {![dict exists $point $orientation $from $by]} { return $from }

	return [dict get $point $orientation $from $by]
}

proc coordinate {centrex centrey orientation position} {
	variable coordinate

	if {![dict exists $coordinate $orientation $position x]} { set position "centre" }

	set x [expr {$centrex + [dict get $coordinate $orientation $position x]}]
	set y [expr {$centrey + [dict get $coordinate $orientation $position y]}]

	return [list $x $y]
}

proc directions {orientation} {
	variable faces
	return $faces($orientation)
}

# return next (clockwise) direction
proc next_direction {orientation direction} {
	variable face
	return [dict get $face $orientation $direction 1]
}

proc opposite_direction {orientation direction} {
	variable point
	return [dict get $point $orientation $direction 2]
}

proc random_direction {orientation} { 
	return [lindex [directions $orientation] [expr {int(rand()*3)}]]
}

proc rotate_arm {orientation arm by} {
	return [face $orientation $arm [expr {$by%3}]]
}

proc add_arm_ok {x y link_id direction} {return 1}
proc add_link_ok {x y new_link} {return 1}

proc add_arm_connector_type {x y link_id arm} {
	set old_connector_type [::tile::get connector_type]

	set link [::tile::link $link_id]

	switch -- $old_connector_type {
		"" {return "mirror"}
		"mirror" {return "threeway"}
		default {error "attempt to add $arm arm to link $link on tile @ $x,$y"}
	}
}

proc remove_arm_connector_type {x y link_id arm} {
	set old_connector_type [::tile::get connector_type]

	switch -- $old_connector_type {
		"threeway" {return "mirror"}
		default {error "attempt to remove $arm arm from link $link on tile @ $x,$y"}
	}
	
}

# link must contain exactly 2 arms
proc add_link_connector_type {x y link} {
	if {[::tile::get links]>0} { return "" }

	# first link
	return "mirror"
}

proc remove_link_connector_type {x y link_id} {	return "" }

proc update_teleporter {x y} {
	::tile::set description "Teleporter"
	::tile::set complete 1
}

proc update_source {x y} {
	# how many links
	set links [::tile::get links]
	# colour
	set colour [::tile::get colour]

	switch -- $links {
		0 {set description "Eunuch source: $colour"}
		1 {set description "Single source: $colour"}
		2 {set description "Double source: $colour"}
		3 {set description "Triple source: $colour"}
	}

	::tile::set description $description
	::tile::set complete 1
}

proc update_connector {x y} {
	set description ""
	set fg_items {}
	set bg_items {}

	# first link
	switch -- [::tile::get connector_type] {
		"mirror" { set description "Mirror"	}
		"threeway" { set description "Threeway" }
	}
	::tile::set description $description
	::tile::set complete 1
}

proc update_node {x y} {
	set colour [::tile::get colour]
	::tile::set description "Node: $colour"
	::tile::set complete 1
	::tile::light_node
}

proc finalise_teleporter {x y} {}
proc finalise_source {x y} {}
proc finalise_connector {x y} {}
proc finalise_node {x y} {}

proc connector_to_prism {x y} { return {} }

proc draw_outline {x y pointx pointy} {
	set size [::grid::get tile_pixels]
	set orientation [::tile::get orientation]
	::tile::add bg_items [::geometry::equilateralTriangle $pointx $pointy $orientation $size -fill "" -outline white]
}

# draw a source
proc draw_source {x y pointx pointy} {
	set size [::grid::get tile_pixels]
	set orientation [::tile::get orientation]
	set colour [::tile::get colour]

	set x1 $pointx
	set y1 $pointy

	switch -- $orientation {
		"n" { set y1 [expr {$pointy+1*$size/(3*$::Q3)}] }
		"e" { set x1 [expr {$pointx-1*$size/(3*$::Q3)}] }
		"s" { set y1 [expr {$pointy-1*$size/(3*$::Q3)}] }
		"w" { set x1 [expr {$pointx+1*$size/(3*$::Q3)}] }
	}

	::tile::add bg_items [::geometry::equilateralTriangle $pointx $pointy $orientation $size -fill #$::blockColour -width 0]
	::tile::add fg_items [::geometry::equilateralTriangle $x1 $y1 $orientation [expr {2*$size/3}] -fill #[colour::bright_rgb $colour] -width 0]
}

proc draw_connector {x y pointx pointy} {
	set connector_type [::tile::get connector_type]
	set orientation [::tile::get orientation]
	set link [::tile::link [lindex [::tile::get all_link_ids] 0]]

	switch -- $connector_type {
		"mirror" {
			::tile::add fg_items {*}[mirror $pointx $pointy $orientation $link]
		}
		"threeway" {
			::tile::add fg_items {*}[threeway $pointx $pointy $orientation]
		}
	}
}

proc draw_node {x y pointx pointy} {
	set size [::grid::get tile_pixels]
	set diameter [::grid::get node_diameter]
	set orientation [::tile::get orientation]
	set colour [::tile::get colour]

	set width [expr {max(1,$size/20)}]
	lassign [coordinate $pointx $pointy $orientation centre] x1 y1

	# if node is lit...
	if {[::tile::get lit]} {
		set fill "#[colour::bright_rgb $colour]"
		set outline "#[colour::bright_rgb $colour]"
	} else {
		# find out what colours are coming in
		set colours [::tile::colours]
		if {$colours!={}} {
			set fill "#[colour::dull_rgb [colour::combine $colours]]"
		} else {
			set fill ""
		}
		set outline "#[colour::dull_rgb $colour]"
	}
	::tile::add fg_items [::geometry::circle $x1 $y1 $diameter -fill $fill -width $width -outline $outline]
}

proc draw_links {x y pointx pointy} {
	set size [::grid::get tile_pixels]
	set width [::grid::get path_width]
	set orientation [::tile::get orientation]
	set type [::tile::get type]

	lassign [coordinate $pointx $pointy $orientation centre] x1 y1

	::tile::each_link {
		set colour_list [::tile::link_colours $link_id]
		if {$colour_list!={}} {
			set colour [colour::combine $colour_list]
			foreach arm $link {
				
				set position "$arm face"
				lassign [coordinate $pointx $pointy $orientation $position] x2 y2
				::tile::add link_items [geometry::line $x1 $y1 $x2 $y2 $width -fill #[colour::bright_rgb $colour]]
			} 
		}
	}
}

proc mirror {x y orientation link} {
	set length [::grid::get tile_pixels]
	set blockHeight [expr {$length/(3*$::Q3)}]
	set mirrorHeight [expr {$length/(2*$::Q3)}]
	set mirrorLength [expr {$length-1}]

	set mirrorx $x
	set mirrory $y

	switch -- $orientation {
		"n" {set mirrory [expr {$mirrory+1}]}
		"e" {set mirrorx [expr {$mirrorx-1}]}
		"s" {set mirrory [expr {$mirrory-1}]}
		"w" {set mirrorx [expr {$mirrorx+1}]}
	}

	if {[face $orientation [lindex $link 0] 1]==[lindex $link 1]} {
		set point [point $orientation [lindex $link 0] 1]
	} else {
		set point [point $orientation [lindex $link 1] 1]
	}

	lappend items [::geometry::equilateralTrapezoid $mirrorx $mirrory $orientation $point $mirrorLength $mirrorHeight -fill #$::mirrorColour -width 0]
	lappend items [::geometry::equilateralTrapezoid $x $y $orientation $point $length $blockHeight -fill #$::blockColour -width 0]

	return $items
}

proc threeway {x y orientation} {
	set size [::grid::get tile_pixels]
	set size [expr {$size/5}]

	switch -- $orientation {
		"n" {
			set y0 [expr {$y+(2*$::Q3*$size)}]
			lappend items [::geometry::equilateralTriangle $x $y0 s $size -fill #$::mirrorColour -width 0]
		}
		"e" {
			set x0 [expr {$x-(2*$::Q3*$size)}]
			lappend items [::geometry::equilateralTriangle $x0 $y w $size -fill #$::mirrorColour -width 0]
		}
		"s" {
			set y0 [expr {$y-(2*$::Q3*$size)}]
			lappend items [::geometry::equilateralTriangle $x $y0 n $size -fill #$::mirrorColour -width 0]
		}
		"w" {
			set x0 [expr {$x+(2*$::Q3*$size)}]
			lappend items [::geometry::equilateralTriangle $x0 $y e $size -fill #$::mirrorColour -width 0]
		}
	}

	return $items
}

}