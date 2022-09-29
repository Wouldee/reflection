
namespace eval ::square {

proc new_grid {} {
	variable faces
	variable points
	variable face {}
	variable point {}
	variable coordinate {}

	set faces(straight) {n e s w}
	set faces(left) {nnw nee sse sww}
	set faces(right) {nne see ssw nww}
	set points(straight) {ne se sw nw}
	set points(left) {nne see ssw nww}
	set points(right) {nee sse sww nnw}

	foreach orientation {straight left right} {
		set count 0
		foreach fromFace $faces($orientation) {
			set rotation 0
			while {$rotation<4} {
				set index [expr {($count+$rotation)%4}]
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
	dict set coordinate straight "n face"    x 0
	dict set coordinate straight "n face"    y [expr {0 - $size/2}]
	dict set coordinate straight "ne point"  x [expr {0 + $size/2}]
	dict set coordinate straight "ne point"  y [expr {0 - $size/2}]
	dict set coordinate straight "e face"    x [expr {0 + $size/2}]
	dict set coordinate straight "e face"    y 0
	dict set coordinate straight "se point"  x [expr {0 + $size/2}]
	dict set coordinate straight "se point"  y [expr {0 + $size/2}]
	dict set coordinate straight "s face"    x 0
	dict set coordinate straight "s face"    y [expr {0 + $size/2}]
	dict set coordinate straight "sw point"  x [expr {0 - $size/2}]
	dict set coordinate straight "sw point"  y [expr {0 + $size/2}]
	dict set coordinate straight "w face"    x [expr {0 - $size/2}]
	dict set coordinate straight "w face"    y 0
	dict set coordinate straight "nw point"  x [expr {0 - $size/2}]
	dict set coordinate straight "nw point"  y [expr {0 - $size/2}]

	dict set coordinate left     "nne point" x [expr {0 + ($::Q3-1)*$size/4}]
	dict set coordinate left     "nne point" y [expr {0 - ($::Q3+1)*$size/4}]
	dict set coordinate left     "nee face"  x [expr {0 + $::Q3*$size/4}]
	dict set coordinate left     "nee face"  y [expr {0 - $size/4}]
	dict set coordinate left     "see point" x [expr {0 + ($::Q3+1)*$size/4}]
	dict set coordinate left     "see point" y [expr {0 + ($::Q3-1)*$size/4}]
	dict set coordinate left     "sse face"  x [expr {0 + $size/4}]
	dict set coordinate left     "sse face"  y [expr {0 + $::Q3*$size/4}]
	dict set coordinate left     "ssw point" x [expr {0 - ($::Q3-1)*$size/4}]
	dict set coordinate left     "ssw point" y [expr {0 + ($::Q3+1)*$size/4}]
	dict set coordinate left     "sww face"  x [expr {0 - $::Q3*$size/4}]
	dict set coordinate left     "sww face"  y [expr {0 + $size/4}]
	dict set coordinate left     "nww point" x [expr {0 - ($::Q3+1)*$size/4}]
	dict set coordinate left     "nww point" y [expr {0 - ($::Q3-1)*$size/4}]
	dict set coordinate left     "nnw face"  x [expr {0 - $size/4}]
	dict set coordinate left     "nnw face"  y [expr {0 - $::Q3*$size/4}]

	dict set coordinate right    "nne face"  x [expr {0 + $size/4}]
	dict set coordinate right    "nne face"  y [expr {0 - $::Q3*$size/4}]
	dict set coordinate right    "nee point" x [expr {0 + ($::Q3+1)*$size/4}]
	dict set coordinate right    "nee point" y [expr {0 - ($::Q3-1)*$size/4}]
	dict set coordinate right    "see face"  x [expr {0 + $::Q3*$size/4}]
	dict set coordinate right    "see face"  y [expr {0 + $size/4}]
	dict set coordinate right    "sse point" x [expr {0 + ($::Q3-1)*$size/4}]
	dict set coordinate right    "sse point" y [expr {0 + ($::Q3+1)*$size/4}]
	dict set coordinate right    "ssw face"  x [expr {0 - $size/4}]
	dict set coordinate right    "ssw face"  y [expr {0 + $::Q3*$size/4}]
	dict set coordinate right    "sww point" x [expr {0 - ($::Q3+1)*$size/4}]
	dict set coordinate right    "sww point" y [expr {0 + ($::Q3-1)*$size/4}]
	dict set coordinate right    "nww face"  x [expr {0 - $::Q3*$size/4}]
	dict set coordinate right    "nww face"  y [expr {0 - $size/4}]
	dict set coordinate right    "nnw point" x [expr {0 - ($::Q3-1)*$size/4}]
	dict set coordinate right    "nnw point" y [expr {0 - ($::Q3+1)*$size/4}]
}

proc face {orientation from by} {
	variable face
	return [dict get $face $orientation $from $by]
}

proc point {orientation from by} {
	variable point
	return [dict get $point $orientation $from $by]
}

proc coordinate {centrex centrey orientation position} {
	variable coordinate

	if {![dict exists $coordinate $orientation $position x]} {
		return [list $centrex $centrey]
	}

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
	variable face
	return [dict get $face $orientation $direction 2]
}

proc random_direction {orientation} {
	variable faces
	return [lindex $faces($orientation) [expr {int(rand()*4)}]]
}

proc rotate_arm {orientation arm by} {
	variable face
	return [dict get $face $orientation $arm [expr {$by%4}]]
}

proc add_arm_connector_type {x y link_id arm} {
	set old_connector_type [::tile::get connector_type]

	switch -- $old_connector_type {
		"" {
			set orientation [::tile::get orientation]
			set link [::tile::link $link_id]
			set existing_arm [lindex $link 0]
			if {[face $orientation $existing_arm 2]==$arm} {
				return "straight"
			} else {
				return "mirror"
			}
		}
		"straight" {return "threeway"}
		"mirror" {return "threeway"}
		"threeway" {return "fourway"}
		default {return ""}
	}
}

proc remove_arm_connector_type {x y link_id arm} {
	set old_connector_type [::tile::get connector_type]

	switch -- $old_connector_type {
		"fourway" {return "threeway"}
		"threeway" {
			set orientation [::tile::get orientation]
			set link [::tile::link $link_id]
			set opposite_face [face $orientation $arm 2]
			if {[lsearch $link $opposite_face]>=0} {
				return "mirror"
			} else {
				return "straight"
			}
		}
		default {return ""}
	}
	
}

# link must contain exactly 2 arms
proc add_link_connector_type {x y link} {
	set old_connector_type [::tile::get connector_type]

	switch -- $old_connector_type {
		"straight" {return "straight"}
		"mirror" {return "double"}
		default {return ""}
	}
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
		2 {
			set link1 [::tile::link [lindex [::tile::get all_link_ids] 0]]
			set link2 [::tile::link [lindex [::tile::get all_link_ids] 1]]
			if {[lindex $link1 0]=="n" && [lindex $link2 0]=="s"
			 || [lindex $link1 0]=="s" && [lindex $link2 0]=="n"
			 || [lindex $link1 0]=="w" && [lindex $link2 0]=="e"
			 || [lindex $link1 0]=="e" && [lindex $link2 0]=="w"} {
				set description "Double-straight source: $colour"
			} else {
				set description "Double-L source: $colour"
			}
		}
		3 {set description "Triple source: $colour"}
		4 {set description "Quad source: $colour"}
	}

	::tile::set description $description
}

proc update_connector {x y} {
	set description ""
	set fg_items {}
	set bg_items {}

	switch -- [::tile::get connector_type] {
		"striaght" {set description "Empty"}
		"mirror" {set description "Mirror"}
		"threeway" {set description "Threeway"}
		"fourway" {set description "Fourway"}
		"double" {set description "Double-sided mirror"}
	}

	::tile::set description $description
}


proc update_filter {x y} {
	::tile::each_link {
		if {[::tile::link_filter $link_id]!=""} {
			set colour [::tile::link_filter $link_id]
			break
		}
	}
	::tile::set description "Filter: $colour"
}

proc update_node {x y} {
	set colour [::tile::get colour]
	::tile::set description "Node: $colour"
	::tile::light_node
}

proc finalise_teleporter {x y} {}
proc finalise_source {x y} {}

proc finalise_connector {x y} {
	if {[::tile::get connector_type]=="straight"} {
		# add another link to this tile if there is not already...
		if {[::tile::get links]==1} {
			set link {}
			foreach direction [directions [::tile::get orientation]] {
				if {[::tile::link_ids $direction]=={}} {
					lappend link $direction
				}
			}
			::tile::new_link $link
		}
	}
}
proc finalise_filter {x y} {
	# add another 2 links to this tile
	foreach direction [directions [::tile::get orientation]] {
		if {[::tile::link_ids $direction]!={}} continue
		set link {}
		lappend link $direction
		set link_id [::tile::new_link $link]
		::tile::link_filter $link_id ""
	}
}

proc finalise_node {x y} {}

proc connector_to_prism {x y} { return {} }

proc draw_outline {x y centrex centrey} {
	set size [::grid::get tile_pixels]
	set orientation [::tile::get orientation]
	::tile::add bg_items [::geometry::square $centrex $centrey $orientation $size -fill "" -outline white]
}

proc draw_source {x y centrex centrey} {
	set size [::grid::get tile_pixels]
	set orientation [::tile::get orientation]
	set colour [::tile::get colour]

	set bg_items {}
	set fg_items {}

	::tile::add bg_items [::geometry::square $centrex $centrey $orientation $size -fill #$::blockColour -width 0]
	::tile::add fg_items [::geometry::square $centrex $centrey $orientation [expr {2*$size/3}] -fill #[colour::bright_rgb $colour] -width 0]
}

proc draw_connector {x y centrex centrey} {
	set connector_type [::tile::get connector_type]
	set orientation [::tile::get orientation]
	set link [::tile::link [lindex [::tile::get all_link_ids] 0]]

	switch -- $connector_type {
		"straight" {
			# nothing
		}
		"mirror" {
			::tile::add fg_items {*}[mirror $centrex $centrey $orientation $link]
		}
		"double" {
			::tile::add fg_items {*}[double_mirror $centrex $centrey $orientation $link]
		}
		"threeway" {
			::tile::add fg_items {*}[threeway $centrex $centrey $orientation $link]
		}
		"fourway" {
			::tile::add fg_items {*}[fourway $centrex $centrey $orientation]
		}
	}
}

proc draw_filter {x y centrex centrey} {
	set orientation [::tile::get orientation]

	::tile::each_link {	if {[llength $link]==2} { break } }
	set colour [::tile::link_filter $link_id]

	::tile::add fg_items {*}[filter $centrex $centrey $orientation $link $colour]
}

proc draw_node {x y centrex centrey} {
	set size [::grid::get tile_pixels]
	set diameter [::grid::get node_diameter]
	set colour [::tile::get colour]

	set width [expr {max(1,$size/10)}]

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

	::tile::add fg_items [::geometry::circle $centrex $centrey $diameter -fill $fill -width $width -outline $outline]
}

proc draw_links {x y centrex centrey} {
	set size [::grid::get tile_pixels]
	set width [grid::get path_width]
	set orientation [::tile::get orientation]
	set type [::tile::get type]

	set link_items {}

	::tile::each_link {
		set colour_list [::tile::link_colours $link_id]
		if {$colour_list!={}} {
			set colour [colour::combine $colour_list]
			foreach arm $link {
				# if the tile is a filter, the colour of each arm may vary
				if {[::tile::get type]=="filter"} {
					set colour_list [::tile::arm_colours $link_id $arm]
					set colour [colour::combine $colour_list]
					if {$colour==""} continue
				}
				
				set position "$arm face"
				lassign [coordinate $centrex $centrey $orientation $position] x1 y1
				lappend link_items [geometry::line $centrex $centrey $x1 $y1 $width -fill #[colour::bright_rgb $colour]]
			} 
		}
	}

	::tile::add link_items {*}$link_items
}

proc mirror {x y orientation link} {
	set size [expr {double([::grid::get tile_pixels])}]
	set width [expr {$size/10}]

	if {[face $orientation [lindex $link 0] 1]==[lindex $link 1]} {
		set face [lindex $link 1]
	} else {
		set face [lindex $link 0]
	}

	lassign [coordinate $x $y $orientation "[point $orientation $face 1] point"] x1 y1
	lassign [coordinate $x $y $orientation "[point $orientation $face 2] point"] x2 y2
	lassign [coordinate $x $y $orientation "[point $orientation $face 3] point"] x3 y3

	lappend items [::geometry::line $x1 $y1 $x3 $y3 $width -fill #$::mirrorColour]
	lappend items [::geometry::polygon $x1 $y1 $x2 $y2 $x3 $y3 -fill #$::blockColour -width 0]

	return $items
}

proc double_mirror {x y orientation link} {
	set size [expr {double([::grid::get tile_pixels])}]
	set width1 [expr {$size/10}]
	set width2 [expr {$size/20}]

	if {[face $orientation [lindex $link 0] 1]==[lindex $link 1]} {
		set fromPoint [point $orientation [lindex $link 1] 1]
		set toPoint [point $orientation [lindex $link 1] 3]
	} else {
		set fromPoint [point $orientation [lindex $link 0] 1]
		set toPoint [point $orientation [lindex $link 0] 3]
	}
	set from "$fromPoint point"
	set to "$toPoint point"
	lassign [coordinate $x $y $orientation $from] x1 y1
	lassign [coordinate $x $y $orientation $to] x2 y2

	lappend items [::geometry::line $x1 $y1 $x2 $y2 $width1 -fill #$::mirrorColour]
	lappend items [::geometry::line $x1 $y1 $x2 $y2 $width2 -fill #$::blockColour]

	return $items
	
}

proc threeway {x y orientation link} {
	set size [expr {double([::grid::get tile_pixels])}]
	set width [expr {$size/10}]

	set face [lindex $link 0]
	while 1 {
		set face [face $orientation $face 1]
		if {[lsearch $link $face]<0} break
	}

	set point1 [point $orientation $face 1]
	set point2 [point $orientation $face 4]

	lassign [coordinate $x $y $orientation "$point1 point"] x1 y1
	lassign [coordinate $x $y $orientation "$point2 point"] x2 y2

	lappend items [::geometry::line $x $y $x1 $y1 $width -fill #$::mirrorColour]
	lappend items [::geometry::line $x $y $x2 $y2 $width -fill #$::mirrorColour]
	lappend items [::geometry::polygon $x $y $x1 $y1 $x2 $y2 -fill #$::blockColour -width 0]

	return $items
}

proc fourway {x y orientation} {
	set size [expr {double([::grid::get tile_pixels])}]

	switch -- $orientation {
		"straight" {
			set diagonal [expr {$size/10}]
			lappend items [::geometry::diamond $x $y $diagonal -fill #$::mirrorColour -width 0]
		}
		"left" {
			set rSize [expr {$size/10}]
			lappend items [::geometry::square $x $y right $rSize -fill #$::mirrorColour -width 0]
		}
		"right" {
			set rSize [expr {$size/10}]
			lappend items [::geometry::square $x $y left $rSize -fill #$::mirrorColour -width 0]
		}
	}
	return $items
}

proc filter {x y orientation link colour} {
	set size [expr {double([::grid::get tile_pixels])}]
	set fWidth [expr {$size/2}]
	set bWidth [expr {2*$size/3}]

	lassign [coordinate $x $y $orientation "[lindex $link 0] face"] x1 y1
	lassign [coordinate $x $y $orientation "[lindex $link 1] face"] x2 y2

	set x1 [expr {$x + ($x-$x1)/2}]
	set y1 [expr {$y + ($y-$y1)/2}]
	set x2 [expr {$x + ($x-$x2)/2}]
	set y2 [expr {$y + ($y-$y2)/2}]

	lappend items [::geometry::line $x1 $y1 $x2 $y2 $bWidth -fill #$::blockColour]
	lappend items [::geometry::line $x1 $y1 $x2 $y2 $fWidth -fill #[::colour::dull_rgb $colour]]
	return $items
}

}