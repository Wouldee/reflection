
namespace eval ::pentagon {

proc new_grid {} {
	variable faces
	variable points
	variable face {}
	variable point {}
	variable coordinate {}

	set faces(up)    {nne see s sww nnw}
	set points(up)   {n nee sse ssw nww}
	set faces(down)  {n nee sse ssw nww}
	set points(down) {nne see s sww nnw}

	foreach orientation {up down} {
		set count 0
		foreach fromFace $faces($orientation) {
			set rotation 0
			while {$rotation<5} {
				set index [expr {($count+$rotation)%5}]
				set toFace [lindex $faces($orientation) $index]
				set toPoint [lindex $points($orientation) $index]
				dict set face $orientation $fromFace $rotation $toFace

				incr rotation
				dict set point $orientation $fromFace $rotation $toPoint
			}
			incr count
		}
	}

	# then from each point to each other point and to each face
	foreach orientation {up down} {
		set count 0
		foreach fromPoint $points($orientation) {
			for {set rotation 0} {$rotation<5} {incr rotation} {
				set index [expr {($count+$rotation)%5}]
				set toPoint [lindex $points($orientation) $index]
				dict set point $orientation $fromPoint $rotation $toPoint
			}

			for {set rotation 1} {$rotation<=5} {incr rotation} {
				set index [expr {($count+$rotation)%5}]
				set toFace [lindex $faces($orientation) $index]
				dict set face $orientation $fromPoint $rotation $toFace
			}
			incr count
		}
	}

	# pentagon measurements, relative to size
	set height [expr {$size*sqrt(5 + 2*$::Q5)/2}]          ;# ~1.538842 height of the pentagon, from s face to n tip
	set width [expr {$size*(1 + $::Q5)/2}]                 ;# ~1.618034 width of the pentagon, distance from nee to nww tips
	set outerRadius [expr {$size*sqrt(2/(5 - $::Q5))}]     ;# ~0.850651 distance from the centre to any point (outer redial)
	set innerRadius [expr {$size/(2*sqrt(5 - 2*$::Q5))}]   ;# ~0.688191 distance from the centre to the midpoint of any face (inner radial)
	set middleRadius [expr {$size*2/(5 - $::Q5)}]          ;# ~0.723607 distance from the centre to the edge, from midway between the inner and outer radial lines
	set sideHeight [expr {$size*sqrt(10 + 2*$Q5)/4}]       ;# ~0.951057 vertical distance from the base of the up pentagon to the nee & nww points
	set topHeight [expr {$size*sqrt(10 - 2*$Q5)/4}]        ;# ~0.587785 vertical distance from the nee & nww points to the n tip

	set shortLine [expr {$size/(sqrt(10 + 2*$::Q5))}]    ;# ...

	set size [::grid::get tile_pixels]

	dict set coordinate up "n point"   x 0
	dict set coordinate up "n point"   y [expr {0 - $outerRadius}]
	dict set coordinate up "nne face"  x [expr {0 + $width/4}]
	dict set coordinate up "nne face"  y [expr {0 - ($outerRadius - $topHeight/2)}]
	dict set coordinate up "nee point" x [expr {0 + $width/2}]
	dict set coordinate up "nee point" y [expr {0 - ($outerRadius - $topHeight)}]
	dict set coordinate up "see face"  x [expr {0 + ($width + 1)/2}]
	dict set coordinate up "see face"  y [expr {0 + ($innerRadius - $sideHeight/2)}]
	dict set coordinate up "sse point" x [expr {0 + $size/2}]
	dict set coordinate up "sse point" y [expr {0 + $innerRadius}]
	dict set coordinate up "s face"    x 0
	dict set coordinate up "s face"    y [expr {0 + $innerRadius}]
	dict set coordinate up "ssw point" x [expr {0 - $size/2}]
	dict set coordinate up "ssw point" y [expr {0 + $innerRadius}]
	dict set coordinate up "sww face"  x [expr {0 - ($width + 1)/2}]
	dict set coordinate up "sww face"  y [expr {0 + ($innerRadius - $sideHeight/2)}]
	dict set coordinate up "nww point" x [expr {0 - $width/2}]
	dict set coordinate up "nww point" y [expr {0 - ($outerRadius - $topHeight)}]
	dict set coordinate up "nnw face"  x [expr {0 - $width/4}]
	dict set coordinate up "nnw face"  y [expr {0 - ($outerRadius - $topHeight/2)}]

	dict set coordinate down "n face"    x 0
	dict set coordinate down "n face"    y [expr {0 - $innerRadius}]
	dict set coordinate down "nnw point" x [expr {0 - $size/2}]
	dict set coordinate down "nnw point" y [expr {0 - $innerRadius}]
	dict set coordinate down "nww face"  x [expr {0 - ($width + 1)/2}]
	dict set coordinate down "nww face"  y [expr {0 - ($innerRadius - $sideHeight/2)}]
	dict set coordinate down "sww point" x [expr {0 - $width/2}]
	dict set coordinate down "sww point" y [expr {0 + ($outerRadius - $topHeight)}]
	dict set coordinate down "ssw face"  x [expr {0 - $width/4}]
	dict set coordinate down "ssw face"  y [expr {0 + ($outerRadius - $topHeight/2)}]
	dict set coordinate down "s point"   x 0
	dict set coordinate down "s point"   y [expr {0 + $outerRadius}]
	dict set coordinate down "sse face"  x [expr {0 + $width/4}]
	dict set coordinate down "sse face"  y [expr {0 + ($outerRadius - $topHeight/2)}]
	dict set coordinate down "see point" x [expr {0 + $width/2}]
	dict set coordinate down "see point" y [expr {0 + ($outerRadius - $topHeight)}]
	dict set coordinate down "nee face"  x [expr {0 + ($width + 1)/2}]
	dict set coordinate down "nee face"  y [expr {0 - ($innerRadius - $sideHeight/2)}]
	dict set coordinate down "nne point" x [expr {0 + $size/2}]
	dict set coordinate down "nne point" y [expr {0 - $innerRadius}]

	# also need to know the mid-points of the radial lines between the points and the faces
	# relative to size = 1
	set midInnerEdge [expr {1/(2*$::Q5)}]            ;# distance along an edge, from a middle radius to the nearest point (outer radius)
	set midOuterEdge [expr {($::Q5 - 1)/(2*$::Q5)}]  ;# distance along an edge, from a middle radius, to the middle of the edge (inner radius)

	dict set coordinate up "nne n mid"   x [expr {0 + $midOuterEdge*$width/2}]
	dict set coordinate up "nne n mid"   y [expr {0 - $outerRadius + $midOuterEdge*$topHeight/2}]
	dict set coordinate up "nne nee mid" x [expr {0 + $width/4 + $midInnerEdge*$width/2}]
	dict set coordinate up "nne nee mid" y [expr {0 - ($outerRadius - $topHeight/2) + $midInnerEdge*$topHeight/2}]
	dict set coordinate up "see nee mid" x [expr {0 + $width/2 - $midOuterEdge*($width - $size)/2}]
	dict set coordinate up "see nee mid" y 0
	dict set coordinate up "see sse mid" x [expr {0 + $size/2 + $midOuterEdge*($width - $size)/2}]
	dict set coordinate up "see sse mid" y [expr {0 + $innerRadius - $midOuterEdge*$sideHeight}]
	dict set coordinate up "s sse mid"   x [expr {0 + $midInnerEdge*$size}]
	dict set coordinate up "s sse mid"   y [expr {0 + $innerRadius}]
	dict set coordinate up "s ssw mid"   x [expr {0 - $midInnerEdge*$size}]
	dict set coordinate up "s ssw mid"   y [expr {0 + $innerRadius}]
	dict set coordinate up "sww sse mid" x [expr {0 - $size/2 - $midOuterEdge*($width - $size)/2}]
	dict set coordinate up "sww sse mid" y [expr {0 + $innerRadius - $midOuterEdge*$sideHeight}]
	dict set coordinate up "sww nww mid" x [expr {0 - $width/2 + $midOuterEdge*($width - $size)/2}]
	dict set coordinate up "sww nww mid" y 0
	dict set coordinate up "nnw nww mid" x [expr {0 - $width/4 - $midInnerEdge*$width/2}]
	dict set coordinate up "nnw nww mid" y [expr {0 - ($outerRadius - $topHeight/2) + $midInnerEdge*$topHeight/2}]
	dict set coordinate up "nnw n mid"   x [expr {0 - $midOuterEdge*$width/2}]
	dict set coordinate up "nnw n mid"   y [expr {0 - $outerRadius + $midOuterEdge*$topHeight/2}]

	dict set coordinate down "n nnw mid"   x [expr {0 - $midInnerEdge*$size}]
	dict set coordinate down "n nnw mid"   y [expr {0 - $innerRadius}]
	dict set coordinate down "nww nne mid" x [expr {0 - $size/2 - $midOuterEdge*($width - $size)/2}]
	dict set coordinate down "nww nne mid" y [expr {0 - $innerRadius + $midOuterEdge*$sideHeight}]
	dict set coordinate down "nww sww mid" x [expr {0 - $width/2 + $midOuterEdge*($width - $size)/2}]
	dict set coordinate down "nww sww mid" y 0
	dict set coordinate down "ssw sww mid" x [expr {0 - $width/4 - $midInnerEdge*$width/2}]
	dict set coordinate down "ssw sww mid" y [expr {0 + ($outerRadius - $topHeight/2) - $midInnerEdge*$topHeight/2}]
	dict set coordinate down "ssw s mid"   x [expr {0 - $midOuterEdge*$width/2}]
	dict set coordinate down "ssw s mid"   y [expr {0 + $outerRadius - $midOuterEdge*$topHeight/2}]
	dict set coordinate down "sse s mid"   x [expr {0 + $midOuterEdge*$width/2}]
	dict set coordinate down "sse s mid"   y [expr {0 + $outerRadius - $midOuterEdge*$topHeight/2}]
	dict set coordinate down "sse see mid" x [expr {0 + $width/4 + $midInnerEdge*$width/2}]
	dict set coordinate down "sse see mid" y [expr {0 + ($outerRadius - $topHeight/2) - $midInnerEdge*$topHeight/2}]
	dict set coordinate down "nee see mid" x [expr {0 + $width/2 - $midOuterEdge*($width - $size)/2}]
	dict set coordinate down "nee see mid" y 0
	dict set coordinate down "nee nne mid" x [expr {0 + $size/2 + $midOuterEdge*($width - $size)/2}]
	dict set coordinate down "nee nne mid" y [expr {0 - $innerRadius + $midOuterEdge*$sideHeight}]
	dict set coordinate down "n nne mid"   x [expr {0 + $midInnerEdge*$size}]
	dict set coordinate down "n nne mid"   y [expr {0 - $innerRadius}]
}

proc face {orientation from by} {
	variable face
	return [dict get $face $orientation $from $by]
}

proc point {orientation from by} {
	variable point
	return [dict get $point $orientation $from $by]
}

proc mid {orientation }

proc coordinate {centrex centrey orientation position} {
	variable coordinate

	#if {![dict exists $coordinate $orientation $position x]} {
	#	return [list $centrex $centrey]
	#}

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
	return [dict get $point $orientation $direction 3]
}

proc random_direction {orientation} {
	variable faces
	return [lindex $faces($orientation) [expr {int(rand()*5)}]]
}

proc rotate_arm {orientation arm by} {
	variable face
	return [dict get $face $orientation $arm [expr {$by%5}]]
}

proc add_arm_connector_type {x y link_id arm} {
	set old_connector_type [::tile::get connector_type]

	switch -- $old_connector_type {
		"" {
			set orientation [::tile::get orientation]
			set link [::tile::link $link_id]
			set existing_arm [lindex $link 0]
			if {[face $orientation $existing_arm 2]==$arm || [face $orientation $existing_arm 3]==$arm} {
				return "obtuse-mirror"
			} else {
				return "adjacent-mirror"
			}
		}
		"obtuse-mirror" {
			set orientation [::tile::get orientation]
			set link [::tile::link $link_id]

			if {[lsearch $link [face $orientation $arm 1]]>=0 &&
			    [lsearch $link [face $orientation $arm 4]]>=0} {
				# Adjacent Threeway
				return "adjacent-threeway"
			}

			# Fork threeway
			return "fork-threeway"
		}
		"adjacent-mirror" {
			set orientation [::tile::get orientation]
			set link [::tile::link $link_id]

			if {[lsearch $link [face $orientation $arm 2]]>=0 &&
			    [lsearch $link [face $orientation $arm 3]]>=0} {
				# Fork Threeway
				return "fork-threeway"
			}

			# Fork threeway
			return "adjacent-threeway"
		}
		"adjacent-threeway" -
		"fork-threeway" {
			return "fourway"
		}
		"fourway" {return "fiveway"}
		"double-mirror" { return "" }
		default {error "attempt to add $arm arm to link $link_id on tile @ $x,$y\n[::tile::dump]"}
	}
}

proc remove_arm_connector_type {x y link_id arm} {
	set old_connector_type [::tile::get connector_type]

	switch -- $old_connector_type {
		"fiveway" { return "fourway" }
		"fourway" {
			set orientation [::tile::get orientation]
			set link [::tile::link $link_id]

			if {[lsearch $link [face $orientation $arm 1]]>=0 &&
			    [lsearch $link [face $orientation $arm 4]]>=0} {
				return "fork-threeway"
			}
			return "adjacent-threeway"
		}
		"adjacent-threeway" {
			set orientation [::tile::get orientation]
			set link [::tile::link $link_id]

			if {[lsearch $link [face $orientation $arm 1]]>=0 &&
			    [lsearch $link [face $orientation $arm 4]]>=0} {
				return "obtuse-mirror"
			}

			return "adjacent-mirror"
		}
		"fork-threeway" {
			set orientation [::tile::get orientation]
			set link [::tile::link $link_id]

			if {[lsearch $link [face $orientation $arm 2]]>=0 &&
			    [lsearch $link [face $orientation $arm 3]]>=0} {
				return "adjacent-mirror"
			}
			return "obtuse-mirror"
		}
		default {error "attempt to remove $arm arm from link $link_id on tile @ $x,$y\n[::tile::dump]"}
	}
	
}

# link must contain exactly 2 arms
proc add_link_connector_type {x y link} {
	set old_connector_type [::tile::get connector_type]

	switch -- $old_connector_type {
		"obtuse-mirror" {
			set orientation [::tile::get orientation]

			# new link must be adjacent
			set arm1 [lindex $link 0]
			set arm2 [lindex $link 1]
			if {[face $orientation $arm1 1] != $arm2 && [face $orientation $arm1 4] != $arm2} { return "" }

			return "double-mirror"
		}
		"adjacent-mirror" {
			set orientation [::tile::get orientation]

			# new link must be obtuse
			set arm1 [lindex $link 0]
			set arm2 [lindex $link 1]
			if {[face $orientation $arm1 1] == $arm2 || [face $orientation $arm1 4] == $arm2} { return "" }

			return "double-mirror"
		}
		"fork-threeway" { return "" }
		"adjacent-threeway" { return "" }
		default {error "attempt to add link $link to tile @ $x,$y\n[::tile::dump]"}
	}
}

proc remove_link_connector_type {x y link_id} {	return "" }

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
		4 {set description "Quad source: $colour"}
		5 {set description "Quint source: $colour"}
	}

	::tile::set description $description
	::tile::set complete 1
}

proc update_connector {x y} {
	set description ""
	set fg_items {}
	set bg_items {}

	#set links {}
	#::tile::each_link {lappend links $link}
	set orientation [::tile::get orientation]

	#set arm_ids {}
	#foreach direction [directions $orientation] {
	#	set link_ids [::tile::link_ids $direction]
	#	if {$link_ids=={}} {
	#		lappend arm_ids -1
	#	} else {
	#		lappend arm_ids [lindex $link_ids 0]
	#	}
	#}
	# set connector_type [connector_type {*}$arm_ids $links]
	set connector_type [::tile::get connector_type]

	switch -- $connector_type {
		"straight" { set description "Empty" }
		"obtuse-mirror" { set description "Obtuse Mirror" }
		"adjacent-mirror" { set description "Adjacent Mirror" }
		"fork-threeway" { set description "Forked Threeway" }
		"adjacent-threeway" { set description "Adjacent Threeway" }
		"fourway" {	set description "Fourway" }
		"fiveway" { set description "Fiveway" }
		"double-mirror" { set description "Double Mirror" }
	}

	::tile::set description $description
	# ::tile::set connector_type $connector_type
	::tile::set complete 1
}

proc update_node {x y} {
	set colour [::tile::get colour]
	::tile::set description "Node: $colour"
	::tile::set complete 1
	::tile::light_node
}

proc finalise_source {x y} {}

proc finalise_connector {x y} {
	set type [::tile::get connector_type]
	set orientation [::tile::get orientation]


	switch -- $type {
		"obtuse-mirror" {
			# add an extra link that goes nowhere
			# logically it should reflect the light back the way it came, but currently this would have
			# no actual effect. This may change, e.g. a splitter...
			set link [::tile::link [lindex [::tile::get all_link_ids] 0]]
			if {[face $orientation [lindex $link 0] 2]==[lindex $link 1]} {
				set direction [face $orientation [lindex $link 0] 1]
			} else {
				set direction [face $orientation [lindex $link 1] 1]
			}

			if {[::tile::link_ids $direction]=={}} {
				set new_link [list $direction]
				::tile::new_link $new_link
			}
		}
		"adjacent-mirror" {}
		"fork-threeway" {}
		"adjacent-threeway" {}
		"fourway" {}
		"fiveway" {}
		"double-adjacent-mirror" {}
		"double-mirror" {
			# add a dead end link to the face between the obtuse directions
			::tile::each_link {
				if {[face $orientation [lindex $link 0] 2]==[lindex $link 1]} {
					set direction [face $orientation [lindex $link 0] 1]
				} elseif {[face $orientation [lindex $link 1] 2]==[lindex $link 0]} {
					set direction [face $orientation [lindex $link 1] 1]
				} else {
					continue
				}

				if {[::tile::link_ids $direction]=={}} {
					set new_link [list $direction]
					::tile::new_link $new_link
				}
			}
		}
		default {error "unknown connector type: $type\n[::tile::dump]"}
	}
}

proc finalise_node {x y} {}

# return the arms that would become part of a prism if the connector
# was turned into a prism
proc connector_to_prism {x y} { return {} }

proc draw_outline {x y centrex centrey} {
	set size [::grid::get tile_pixels]
	set orientation [::tile::get orientation]
	::tile::add bg_items [::geometry::pentagon $centrex $centrey $orientation $size -fill "" -outline white]
}

proc draw_source {x y centrex centrey} {
	set size [::grid::get tile_pixels]
	set orientation [::tile::get orientation]
	set colour [::tile::get colour]

	set blockSize $size
	set lightSize [expr {2*$blockSize/3}]

	::tile::add bg_items [::geometry::pentagon $centrex $centrey $orientation $blockSize -fill #$::blockColour -width 0]
	::tile::add fg_items [::geometry::pentagon $centrex $centrey $orientation $lightSize -fill #[colour::bright_rgb $colour] -width 0]
}

proc draw_connector {x y centrex centrey} {
	set connector_type [::tile::get connector_type]
	set orientation [::tile::get orientation]
	set link [::tile::link [lindex [::tile::get all_link_ids] 0]]

	switch -- $connector_type {
		"obtuse-mirror" { ::tile::add fg_items {*}[obtuse_mirror $centrex $centrey $orientation $link] }
		"adjacent-mirror" {	::tile::add fg_items {*}[adjacent_mirror $centrex $centrey $orientation $link] }
		"fork-threeway" { ::tile::add bg_items {*}[star_block $centrex $centrey $orientation $link] }
		"adjacent-threeway" { ::tile::add fg_items {*}[star_block $centrex $centrey $orientation $link] }
		"fourway" {	::tile::add fg_items {*}[star_block $centrex $centrey $orientation $link] }
		"fiveway" { ::tile::add fg_items {*}[star_block $centrex $centrey $orientation $link] }
		"double-mirror" {
			set link2 [::tile::link [lindex [::tile::get all_link_ids] 1]]
			::tile::add fg_items {*}[double_mirror $centrex $centrey $orientation $link $link2]
		}
	}
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
	set width [::grid::get path_width]
	set type [::tile::get type]
	set orientation [::tile::get orientation]

	::tile::each_link {
		set colour_list [::tile::link_colours $link_id]
		if {$colour_list!={}} {
			set colour [colour::combine $colour_list]
			foreach arm $link {
				set position "$arm face"
				lassign [coordinate $centrex $centrey $orientation $position] x1 y1
				::tile::add link_items [geometry::line $centrex $centrey $x1 $y1 $width -fill #[colour::bright_rgb $colour]]
			} 
		}
	}
}

proc obtuse_mirror {x y orientation link} {
	if {[face $orientation [lindex $link 0] 2]==[lindex $link 1]} {
		set fromFace  [lindex $link 1]
		set toFace    [lindex $link 0]
	} else {
		set fromFace  [lindex $link 0]
		set toFace    [lindex $link 1]
	}

	set fromPoint [point $orientation $fromFace 1]
	set toPoint   [point $orientation $toFace 5]

	return [mirror $x $y $orientation "$fromFace $fromPoint mid" "$toFace $toPoint mid"]
}

proc adjacent_mirror {x y orientation link} {
	if {[face $orientation [lindex $link 0] 1]==[lindex $link 1]} {
		set fromFace  [face $orientation [lindex $link 1] 1]
		set toFace    [face $orientation [lindex $link 1] 3]
	} else {
		set fromFace  [face $orientation [lindex $link 0] 1]
		set toFace    [face $orientation [lindex $link 0] 3]
	}

	set fromPoint [point $orientation $fromFace 5]
	set toPoint   [point $orientation $toFace 1]

	return [mirror $x $y $orientation "$fromFace $fromPoint mid" "$toFace $toPoint mid"]
}

proc double_mirror {x y orientation link} {
	if {[face $orientation [lindex $link 0] 1]==[lindex $link 1]} {
		set fromFace [face $orientation [lindex $link 1] 1]
		set toFace   [face $orientation [lindex $link 1] 4]
	} else {
		set fromFace [face $orientation [lindex $link 0] 1]
		set toFace   [face $orientation [lindex $link 0] 4]
	}
	return [double_mirror $x $y $orientation "$fromFace face" "$toFace face"]
}

proc mirror {x y orientation from to} {
	set size [::grid::get tile_pixels]

	set items {}
	set width [expr {$size/10}]

	lassign [coordinate $x $y $orientation $from] x1 y1
	lassign [coordinate $x $y $orientation $to] x2 y2

	# draw mirror face and block
	lappend items [::geometry::line $x1 $y1 $x2 $y2 $width -fill #$::mirrorColour]
	lappend items [block $x $y $orientation $from 6]

	return $items
}

proc double_mirror {x y orientation from to} {
	set size [::grid::get tile_pixels]

	set items {}
	set mirrorWidth [expr {max($size/6,2)}]
	set blockWidth [expr {max($mirrorWidth/2,1)}]

	lassign [coordinate $x $y $orientation $from] x1 y1
	lassign [coordinate $x $y $orientation $to] x2 y2

	# draw mirror face and block
	lappend items [::geometry::line $x1 $y1 $x2 $y2 $mirrorWidth -fill #$::mirrorColour]
	lappend items [::geometry::line $x1 $y1 $x2 $y2 $blockWidth -fill #$::blockColour]

	return $items
}

proc star_block {x y orientation link} {
	set items {}
	foreach arm $link {
		set extent 0
		while {[lsearch $link [face $orientation $arm [expr {($extent+2)/2}]]]<0} {
			incr extent 2
		}
		if {$extent==0} { continue }

		set from "[point $orientation $arm 1] point"
		lappend items [block $x $y $orientation $from $extent]
	}

	lappend items {*}[star $x $y $orientation]

	return $items
}

proc star {x y orientation} {
	set size [::grid::get tile_pixels]
	set pentagramSize [expr {$size/3}]

	lappend items [::geometry::pentagram $x1 $y1 [expr {$orientation eq "up" ? "down" : "up"}] $pentagramSize -fill #$::mirrorColour]

	return $items	
}

proc block {x y orientation from extent} {
	set size [::grid::get tile_pixels]

	lassign $from position type

	set coordinates {}
	lappend coordinates $x $y
	lappend coordinates {*}[coordinate $x $y $orientation $from]

	if {$type=="face"} {
		set position [point $orientation $position 1]
		lappend coordinates {*}[coordinate $x $y $orientation "$position point"]
		incr extent -1
	}

	while {$extent>1} {
		set position [point $orientation $position 1]
		lappend coordinates {*}[coordinate $x $y $orientation "$position point"]
		incr extent -2
	}

	if {$extent==1} {
		set position [face $orientation $position 1]
		lappend coordinates {*}[coordinate $x $y $orientation "$position face"]
	}

	return [::geometry::polygon $coordinates -fill #$::blockColour -width 0]
}

}