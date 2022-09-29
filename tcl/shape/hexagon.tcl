
namespace eval ::hexagon {

proc new_grid {} {
	variable faces
	variable points
	variable face {}
	variable point {}
	variable coordinate {}

	set faces(standing)  {nne e sse ssw w nnw}
	set faces(flat)      {n nee see s sww nww}
	set points(standing) {nee see s sww nww n}
	set points(flat)     {nne e sse ssw w nnw}

	foreach orientation {standing flat} {
		set count 0
		foreach fromFace $faces($orientation) {
			set rotation 0
			while {$rotation<6} {
				set index [expr {($count+$rotation)%6}]
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
	foreach orientation {standing flat} {
		set count 0
		foreach fromPoint $points($orientation) {
			for {set rotation 0} {$rotation<6} {incr rotation} {
				set index [expr {($count+$rotation)%6}]
				set toPoint [lindex $points($orientation) $index]
				dict set point $orientation $fromPoint $rotation $toPoint
			}

			for {set rotation 1} {$rotation<=6} {incr rotation} {
				set index [expr {($count+$rotation)%6}]
				set toFace [lindex $faces($orientation) $index]
				dict set face $orientation $fromPoint $rotation $toFace
			}
			incr count
		}
	}

	set size [::grid::get tile_pixels]
	dict set coordinate standing "n point"   x 0
	dict set coordinate standing "n point"   y [expr {0 - $size}]
	dict set coordinate standing "nne face"  x [expr {0 + $::Q3*$size/4}]
	dict set coordinate standing "nne face"  y [expr {0 - 3*$size/4}]
	dict set coordinate standing "nee point" x [expr {0 + $::Q3*$size/2}]
	dict set coordinate standing "nee point" y [expr {0 - $size/2}]
	dict set coordinate standing "e face"    x [expr {0 + $::Q3*$size/2}]
	dict set coordinate standing "e face"    y 0
	dict set coordinate standing "see point" x [expr {0 + $::Q3*$size/2}]
	dict set coordinate standing "see point" y [expr {0 + $size/2}]
	dict set coordinate standing "sse face"  x [expr {0 + $::Q3*$size/4}]
	dict set coordinate standing "sse face"  y [expr {0 + 3*$size/4}]
	dict set coordinate standing "s point"   x 0
	dict set coordinate standing "s point"   y [expr {0 + $size}]
	dict set coordinate standing "ssw face"  x [expr {0 - $::Q3*$size/4}]
	dict set coordinate standing "ssw face"  y [expr {0 + 3*$size/4}]
	dict set coordinate standing "sww point" x [expr {0 - $::Q3*$size/2}]
	dict set coordinate standing "sww point" y [expr {0 + $size/2}]
	dict set coordinate standing "w face"    x [expr {0 - $::Q3*$size/2}]
	dict set coordinate standing "w face"    y 0
	dict set coordinate standing "nww point" x [expr {0 - $::Q3*$size/2}]
	dict set coordinate standing "nww point" y [expr {0 - $size/2}]
	dict set coordinate standing "nnw face"  x [expr {0 - $::Q3*$size/4}]
	dict set coordinate standing "nnw face"  y [expr {0 - 3*$size/4}]

	dict set coordinate flat     "n face"    x 0
	dict set coordinate flat     "n face"    y [expr {0 - $::Q3*$size/2}]
	dict set coordinate flat     "nne point" x [expr {0 + $size/2}]
	dict set coordinate flat     "nne point" y [expr {0 - $::Q3*$size/2}]
	dict set coordinate flat     "nee face"  x [expr {0 + 3*$size/4}]
	dict set coordinate flat     "nee face"  y [expr {0 - $::Q3*$size/4}]
	dict set coordinate flat     "e point"   x [expr {0 + $size}]
	dict set coordinate flat     "e point"   y 0
	dict set coordinate flat     "see face"  x [expr {0 + 3*$size/4}]
	dict set coordinate flat     "see face"  y [expr {0 + $::Q3*$size/4}]
	dict set coordinate flat     "sse point" x [expr {0 + $size/2}]
	dict set coordinate flat     "sse point" y [expr {0 + $::Q3*$size/2}]
	dict set coordinate flat     "s face"    x 0
	dict set coordinate flat     "s face"    y [expr {0 + $::Q3*$size/2}]
	dict set coordinate flat     "ssw point" x [expr {0 - $size/2}]
	dict set coordinate flat     "ssw point" y [expr {0 + $::Q3*$size/2}]
	dict set coordinate flat     "sww face"  x [expr {0 - 3*$size/4}]
	dict set coordinate flat     "sww face"  y [expr {0 + $::Q3*$size/4}]
	dict set coordinate flat     "w point"   x [expr {0 - $size}]
	dict set coordinate flat     "w point"   y 0
	dict set coordinate flat     "nww face"  x [expr {0 - 3*$size/4}]
	dict set coordinate flat     "nww face"  y [expr {0 - $::Q3*$size/4}]
	dict set coordinate flat     "nnw point" x [expr {0 - $size/2}]
	dict set coordinate flat     "nnw point" y [expr {0 - $::Q3*$size/2}]
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
	variable face
	return [dict get $face $orientation $direction 3]
}

proc random_direction {orientation} {
	variable faces
	return [lindex $faces($orientation) [expr {int(rand()*6)}]]
}

proc rotate_arm {orientation arm by} {
	variable face
	return [dict get $face $orientation $arm [expr {$by%6}]]
}

# BUG: adjacent threeway misidentified as a symmetrical threeway by either this procedure or remove_arm_connector_type
proc add_arm_connector_type {x y link_id arm} {
	set old_connector_type [::tile::get connector_type]

	switch -- $old_connector_type {
		"" {
			set orientation [::tile::get orientation]
			set link [::tile::link $link_id]
			set existing_arm [lindex $link 0]
			if {[face $orientation $existing_arm 3]==$arm} {
				return "straight"
			} elseif {[face $orientation $existing_arm 2]==$arm || [face $orientation $existing_arm 4]==$arm} {
				return "obtuse-mirror"
			} else {
				return "adjacent-mirror"
			}
		}
		"straight" {
			if {[::tile::get links]==1} {
				return "threeway"
			} else {
				return ""
			}
		}
		"obtuse-mirror" {
			set orientation [::tile::get orientation]
			set link [::tile::link $link_id]

			set opposite_face [face $orientation $arm 3]
			if {[lsearch $link $opposite_face]>=0} {
				# Irregular threeway
				return "threeway"
			}

			set adjacent_face [face $orientation $arm 1]
			if {[lsearch $link $adjacent_face]>=0} {
				# Adjacent Threeway
				return "adjacent-threeway"
			}

			# Regular threeway
			return "symmetrical-threeway"
		}
		"adjacent-mirror" {
			set orientation [::tile::get orientation]
			set link [::tile::link $link_id]

			set opposite_face [face $orientation $arm 3]
			if {[lsearch $link $opposite_face]>=0} {
				# Irregular threeway
				return "threeway"
			} else {
				return "adjacent-threeway"
			}
		}
		"threeway" {
			set orientation [::tile::get orientation]
			set link [::tile::link $link_id]

			set opposite_face [face $orientation $arm 3]
			if {[lsearch $link $opposite_face]>=0} {
				# Regular fourway
				return "symmetrical-fourway"
			}

			set right_adjacent_face [face $orientation $arm 1]
			set left_adjacent_face [face $orientation $arm 5]
			if {[lsearch $link $right_adjacent_face]>=0 && [lsearch $link $left_adjacent_face]>=0} {
				# Adjacent fourway
				return "adjacent-fourway"
			}

			# Peace Fourway
			return "fourway"
		}
		"symmetrical-threeway" {return "fourway"}
		"adjacent-threeway" {
			set orientation [::tile::get orientation]
			set link [::tile::link $link_id]

			set right_adjacent_face [face $orientation $arm 1]
			set left_adjacent_face [face $orientation $arm 5]
			if {[lsearch $link $right_adjacent_face]>=0 || [lsearch $link $left_adjacent_face]>=0} {
				# Adjacent fourway
				return "adjacent-fourway"
			}
			return "fourway"
		}
		"fourway" {return "fiveway"}
		"symmetrical-fourway" {return "fiveway"}
		"adjacent-fourway" {return "fiveway"}
		"fiveway" {return "sixway"}
		"double-adjacent-mirror" { return "" }
		"double-obtuse-mirror" { return "" }
		"adjacent-double-adjacent" { return "" }
		"adjacent+obtuse" { return "" }
		default {error "attempt to add $arm arm to link $link_id on tile @ $x,$y\n[::tile::dump]"}
	}
}

proc remove_arm_connector_type {x y link_id arm} {
	set old_connector_type [::tile::get connector_type]

	switch -- $old_connector_type {
		"sixway" {return "fiveway"}
		"fiveway" {
			set orientation [::tile::get orientation]
			set link [::tile::link $link_id]

			set opposite_face [face $orientation $arm 3]
			if {[lsearch $link $opposite_face]<0} {
				return "symmetrical-fourway"
			}

			set right_adjacent_face [face $orientation $arm 1]
			set left_adjacent_face [face $orientation $arm 5]
			if {[lsearch $link $right_adjacent_face]<0 && [lsearch $link $left_adjacent_face]<0} {
				return "adjacent-fourway"
			}

			return "fourway"
		}
		"adjacent-fourway" {
			set orientation [::tile::get orientation]
			set link [::tile::link $link_id]

			set opposite_face [face $orientation $arm 3]
			if {[lsearch $link $opposite_face]>=0} {
				return "adjacent-threeway"
			}
			return "threeway"
		}
		"symmetrical-fourway" {return "threeway"}
		"fourway" {
			set orientation [::tile::get orientation]
			set link [::tile::link $link_id]

			set opposite_face [face $orientation $arm 3]
			if {[lsearch $link $opposite_face]<0} {
				# Irregular threeway
				return "threeway"
			}

			set adjacent_face [face $orientation $arm 1]
			if {[lsearch $link $adjacent_face]>=0} {
				# Regular threeway
				return "symmetrical-threeway"
			}

			return "adjacent-threeway"
		}
		"threeway" {
			set orientation [::tile::get orientation]
			set link [::tile::link $link_id]

			set opposite_face [face $orientation $arm 3]
			if {[lsearch $link $opposite_face]<0} {
				return "straight"
			}

			set right_adjacent_face [face $orientation $arm 1]
			set left_adjacent_face [face $orientation $arm 5]
			if {[lsearch $link $right_adjacent_face]<0 && [lsearch $link $left_adjacent_face]<0} {
				return "adjacent-mirror"
			}

			return "obtuse-mirror"
		}
		"symmetrical-threeway" { return "obtuse-mirror" }
		"adjacent-threeway" {
			set orientation [::tile::get orientation]
			set link [::tile::link $link_id]

			set right_adjacent_face [face $orientation $arm 1]
			set left_adjacent_face [face $orientation $arm 5]
			if {[lsearch $link $right_adjacent_face]<0 || [lsearch $link $left_adjacent_face]<0} {
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
		"straight" {
			set orientation [::tile::get orientation]
			# new link must also be straight
			if {[face $orientation [lindex $link 0] 3]==[lindex $link 1]} {
				return "straight"
			} else {
				return ""
			}
		}
		"obtuse-mirror" {
			set orientation [::tile::get orientation]
			set existing_link [::tile::link [lindex [::tile::get all_link_ids] 0]]

			set connector_type "double-obtuse-mirror"
			foreach arm $link {
				set opposite_face [face $orientation $arm 3]
				if {[lsearch $existing_link $opposite_face]<0} {
					set right_adjacent_face [face $orientation $arm 1]
					set left_adjacent_face [face $orientation $arm 5]
					if {[lsearch $existing_link $right_adjacent_face]<0 || [lsearch $existing_link $left_adjacent_face]<0} {
						set connector_type "adjacent+obtuse"
					} else {
						return ""
					}
				}
			}
			return $connector_type
		}
		"adjacent-mirror" {
			set orientation [::tile::get orientation]
			if {[face $orientation [lindex $link 0] 3]==[lindex $link 1]} { return "" }

			if {[face $orientation [lindex $link 0] 2]==[lindex $link 1] ||
				[face $orientation [lindex $link 0] 4]==[lindex $link 1] } { return "adjacent+obtuse" }

			set existing_link [::tile::link [lindex [::tile::get all_link_ids] 0]]

			set connector_type "double-adjacent-mirror"
			foreach arm $link {
				set opposite_face [face $orientation $arm 3]
				if {[lsearch $existing_link $opposite_face]<0} {
					set connector_type "adjacent-double-adjacent"
				}
			}

			return $connector_type
		}
		"threeway" { return "" }
		"symmetrical-threeway" { return "" }
		"adjacent-threeway" { return "" }
		"fourway" { return "" }
		"symmetrical-fourway" { return "" }
		"adjacent-fourway" { return "" }
		"double-adjacent-mirror" { return "" }
		"double-obtuse-mirror" { return "" }
		"adjacent-double-adjacent" {
			return "triple-mirror"
		}
		"adjacent+obtuse" { return "" }
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
		6 {set description "Hex source: $colour"}
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
 		"threeway" { set description "Irregular Threeway" }
		"symmetrical-threeway" { set description "Regular Threeway" }
		"adjacent-threeway" { set description "Semi-Sixway" }
		"fourway" {	set description "Peace Fourway" }
		"symmetrical-fourway" {	set description "Regular Fourway" }
		"adjacent-fourway" { set description "Adjacent Fourway" }
		"fiveway" { set description "Fiveway" }
		"sixway" { set description "Sixway" }
		"double-adjacent-mirror" { set description "Double Adjacent Mirror" }
		"double-obtuse-mirror" { set description "Double Obtuse Mirror" }
		"adjacent-double-adjacent" { set description "Double Adjacent Triangle" }
		"adjacent+obtuse" {set description "Adjacent & Obtuse" }
		"double-threeway" { set description "Evenly Split Sixway" }
		"threeway+obtuse" { set description "Threeway & Obtuse" }
		"threeway+adjacent" { set description "Threeway & Adjacent" }
		"fourway+adjacent" { set description "Unevenly Split Sixway" }
		"triple-mirror" { set description "Triple mirror" }
	}

	::tile::set description $description
	# ::tile::set connector_type $connector_type
	::tile::set complete 1
}

proc update_filter {x y} {
	::tile::each_link {
		if {[::tile::link_filter $link_id]!=""} {
			set colour [::tile::link_filter $link_id]
			break
		}
	}
	::tile::set description "Filter: $colour"
	::tile::set complete 1
}

proc update_prism {x y} {
	set prism_orientation [::tile::get prism_orientation]
	::tile::set description "Prism: $prism_orientation"
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
		"straight" {
			set link_id [lindex [::tile::get all_link_ids] 0]
			set link [::tile::link $link_id]
			set face [lindex $link 0]
			while 1 {
				set face [face $orientation $face 1]
				if {[lindex [::tile::link_ids $face] 0]==$link_id} break
				if {[::tile::link_ids $face]!={}} continue
				set new_link {}
				lappend new_link $face [face $orientation $face 3]
				::tile::new_link $new_link
			}
		}
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
 		"threeway" { 
			set link [::tile::link [lindex [::tile::get all_link_ids] 0]]
			foreach arm $link {
				set face [face $orientation $arm 2]
				if {[lsearch $link $face]>=0} break
			}
			set direction [face $orientation $face 5]

			if {[::tile::link_ids $direction]=={}} {
				set new_link [list $direction]
				::tile::new_link $new_link
			}
		}
		"symmetrical-threeway" {}
		"adjacent-threeway" {}
		"fourway" {}
		"symmetrical-fourway" {}
		"adjacent-fourway" {}
		"fiveway" {}
		"sixway" {}
		"double-adjacent-mirror" {}
		"double-obtuse-mirror" {
			# add an extra dead end to the two empty faces
			foreach direction [directions $orientation] {
				if {[::tile::link_ids $direction]=={}} {
					set new_link [list $direction]
					::tile::new_link $new_link
				}
			}
		}
		"adjacent-double-adjacent" {}
		"adjacent+obtuse" {
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
		"double-threeway" {}
		"threeway+obtuse" {}
		"threeway+adjacent" {}
		"fourway+adjacent" {}
		"triple-mirror" {}
		default {error "unknown connector type: $type\n[::tile::dump]"}
	}
}

proc finalise_filter {x y} {
	set orientation [::tile::get orientation]
	# add another 4 links to this tile
	foreach direction [directions $orientation] {
		if {[::tile::link_ids $direction]!={}} continue
		set link {}
		lappend link $direction
		set link_id [::tile::new_link $link]
		::tile::link_filter $link_id ""
	}
}

proc finalise_prism {x y} {
	set orientation [::tile::get orientation]
	# add another 2 links to this tile
	foreach direction [directions $orientation] {
		if {[::tile::link_ids $direction]!={}} continue
		set link {}
		lappend link $direction
		set link_id [::tile::new_link $link]
		::tile::link_filter $link_id ""
	}
}

proc finalise_node {x y} {}

# return the arms that would become part of a prism if the connector
# was turned into a prism
proc connector_to_prism {x y} {
	set connector_type [::tile::get connector_type]

	set faces {}

	switch -- $connector_type {
		"adjacent-fourway" {
			set faces [::tile::link [lindex [::tile::get all_link_ids] 0]]
		}
		"adjacent-double-adjacent" {
			::tile::each_link {	lappend faces {*}$link	}
			# bug: add_prism proc needs to check if the same source is involved more than once...
			# until fixed, just return {}
			# should be fixed now
			# return {}
		}
		default { return {} }
	}

	set orientation [::tile::get orientation]
	set colours [::colour::primaries]
	set prism_face {}

	# find the earliest clockwise (left-most) face
	foreach face $faces {
		if {[lsearch $faces [face $orientation $face 5]]<0} { break }
	}

	set sorted_faces {}
	while {[llength $sorted_faces]<4} {
		lappend sorted_faces $face
		set face [face $orientation $face 1]
	}

	# the structure of the prism - a dict indexed by face - prism orientation - attribute
	# there are two attributes - "colours" is a list of colours that can pass through the face
	# "to" is a list of other faces that the face connects to
	set face [lindex $sorted_faces 0]
	dict set prism_face $face left  colours $colours					; # white
	dict set prism_face $face left  to [lrange $sorted_faces 1 3]		; # all other faces
	dict set prism_face $face right colours [lrange $colours 0 0]		; # red
	dict set prism_face $face right to [lrange $sorted_faces 3 3]		; # right face
	set face [lindex $sorted_faces 1]
	dict set prism_face $face left  colours [lrange $colours 2 2]		; # blue
	dict set prism_face $face left  to [lrange $sorted_faces 0 0]		; # left face
	dict set prism_face $face right colours [lrange $colours 1 1]		; # green
	dict set prism_face $face right to [lrange $sorted_faces 3 3]		; # right face
	set face [lindex $sorted_faces 2]
	dict set prism_face $face left  colours [lrange $colours 1 1]		; # green
	dict set prism_face $face left  to [lrange $sorted_faces 0 0]		; # left face
	dict set prism_face $face right colours [lrange $colours 2 2]		; # blue
	dict set prism_face $face right to [lrange $sorted_faces 3 3]		; # right face
	set face [lindex $sorted_faces 3]
	dict set prism_face $face left  colours [lrange $colours 0 0]		; # red
	dict set prism_face $face left  to [lrange $sorted_faces 0 0]		; # left face
	dict set prism_face $face right colours $colours					; # white
	dict set prism_face $face right to [lrange $sorted_faces 0 2]		; # all other faces

	return $prism_face
}

proc draw_outline {x y centrex centrey} {
	set size [::grid::get tile_pixels]
	set orientation [::tile::get orientation]
	::tile::add bg_items [::geometry::hexagon $centrex $centrey $orientation $size -fill "" -outline white]
}

proc draw_source {x y centrex centrey} {
	set size [::grid::get tile_pixels]
	set orientation [::tile::get orientation]
	set colour [::tile::get colour]

	set blockSize $size
	set lightSize [expr {2*$blockSize/3}]

	::tile::add bg_items [::geometry::hexagon $centrex $centrey $orientation $blockSize -fill #$::blockColour -width 0]
	::tile::add fg_items [::geometry::hexagon $centrex $centrey $orientation $lightSize -fill #[colour::bright_rgb $colour] -width 0]
}

proc draw_connector {x y centrex centrey} {
	set connector_type [::tile::get connector_type]
	set orientation [::tile::get orientation]
	set link [::tile::link [lindex [::tile::get all_link_ids] 0]]

	switch -- $connector_type {
		"straight" {
			# nothing 
		}
		"obtuse-mirror" { ::tile::add fg_items {*}[obtuse_mirror $centrex $centrey $orientation $link] }
		"adjacent-mirror" {	::tile::add fg_items {*}[adjacent_mirror $centrex $centrey $orientation $link] }
 		"threeway" { ::tile::add fg_items {*}[irregular_threeway $centrex $centrey $orientation $link] }
		"symmetrical-threeway" { ::tile::add bg_items {*}[symmetrical_threeway $centrex $centrey $orientation $link] }
		"adjacent-threeway" { ::tile::add fg_items {*}[adjacent_threeway $centrex $centrey $orientation $link] }
		"fourway" {	::tile::add fg_items {*}[star_block $centrex $centrey $orientation $link] }
		"symmetrical-fourway" {	::tile::add fg_items {*}[star_block $centrex $centrey $orientation $link] }
		"adjacent-fourway" { ::tile::add fg_items {*}[star_block $centrex $centrey $orientation $link] }
		"fiveway" { ::tile::add fg_items {*}[star_block $centrex $centrey $orientation $link] }
		"sixway" { ::tile::add fg_items {*}[star $centrex $centrey $orientation] }
		"double-adjacent-mirror" { ::tile::add fg_items {*}[double_adjacent_mirror $centrex $centrey $orientation $link] }
		"double-obtuse-mirror" { ::tile::add fg_items {*}[double_obtuse_mirror $centrex $centrey $orientation $link] }
		"adjacent-double-adjacent" {
			set link2 [::tile::link [lindex [::tile::get all_link_ids] 1]]
			::tile::add fg_items {*}[adjacent_double_adjacent $centrex $centrey $orientation $link $link2]
		}
		"adjacent+obtuse" {
			set link2 [::tile::link [lindex [::tile::get all_link_ids] 1]]
			::tile::add fg_items {*}[adjacent_and_obtuse $centrex $centrey $orientation $link $link2]
		}
		"triple-mirror" { ::tile::add fg_items {*}[triple_adjacent_mirror $centrex $centrey $orientation $link] }
	}
}

proc draw_filter {x y centrex centrey} {
	set orientation [::tile::get orientation]

	::tile::each_link { if {[llength $link]==2} { break } }
	set colour [::tile::link_filter $link_id]

	::tile::add fg_items {*}[filter $centrex $centrey $orientation $link $colour]
}

proc draw_prism {x y centrex centrey} {
	set orientation [::tile::get orientation]
	set prism_orientation [::tile::get prism_orientation]

	foreach direction [directions $orientation] {
		if {[llength [::tile::link_ids $direction]]==3} { break }
	}
	set main_face $direction

	::tile::add fg_items {*}[prism $centrex $centrey $orientation $main_face $prism_orientation]
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

	if {$type=="prism"} {
		draw_prism_links $x $y $centrex $centrey
		return
	}

	::tile::each_link {
		set colour_list [::tile::link_colours $link_id]
		if {$colour_list!={}} {
			set colour [colour::combine $colour_list]
			foreach arm $link {
				# if the tile is a filter, the colour of each arm may vary
				if {$type=="filter"} {
					set colour_list [::tile::arm_colours $link_id $arm]
					set colour [colour::combine $colour_list]
					if {$colour==""} continue
				}

				set position "$arm face"
				lassign [coordinate $centrex $centrey $orientation $position] x1 y1
				::tile::add link_items [geometry::line $centrex $centrey $x1 $y1 $width -fill #[colour::bright_rgb $colour]]
			} 
		}
	}
}

# this procedure is because prisms can have more than one link per arm.,... better idea is to calculate the colours of each arm when the link colours get updated in the ::tile procedure and then store tham as an attribute of the tile-arm...
proc draw_prism_links {x y centrex centrey} {
	set size [::grid::get tile_pixels]
	set width [::grid::get path_width]
	set orientation [::tile::get orientation]

	foreach arm [directions $orientation] {
		set colour_list {}
		foreach link_id [::tile::link_ids $arm] {
			lappend colour_list {*}[::tile::arm_colours $link_id $arm]
		}
		set colour [colour::combine [lsort -unique $colour_list]]
		if {$colour==""} continue

		set position "$arm face"
		lassign [coordinate $centrex $centrey $orientation $position] x1 y1
		::tile::add link_items [geometry::line $centrex $centrey $x1 $y1 $width -fill #[colour::bright_rgb $colour]]
	}
}

proc obtuse_mirror {x y orientation link} {
	if {[face $orientation [lindex $link 0] 2]==[lindex $link 1]} {
		set fromPoint [point $orientation [lindex $link 1] 1]
		set toPoint   [point $orientation [lindex $link 1] 4]
	} else {
		set fromPoint [point $orientation [lindex $link 0] 1]
		set toPoint   [point $orientation [lindex $link 0] 4]
	}
	return [mirror $x $y $orientation "$fromPoint point" "$toPoint point"]
}

proc adjacent_mirror {x y orientation link} {
	if {[face $orientation [lindex $link 0] 1]==[lindex $link 1]} {
		set fromFace [face $orientation [lindex $link 1] 1]
		set toFace   [face $orientation [lindex $link 1] 4]
	} else {
		set fromFace [face $orientation [lindex $link 0] 1]
		set toFace   [face $orientation [lindex $link 0] 4]
	}
	return [mirror $x $y $orientation "$fromFace face" "$toFace face"]
}

proc irregular_threeway {x y orientation link} {
	foreach arm $link {
		if {[lsearch $link [face $orientation $arm 1]]>=0} break
	}

	if {[lsearch $link [face $orientation $arm 3]]>=0} {
		set fromPoint [point $orientation $arm 4]
		set toFace [face $orientation $arm 5]
		set from "$fromPoint point"
		set to "$toFace face"
	} else {
		set fromFace [face $orientation $arm 2]
		set toPoint [point $orientation $arm 4]
		set from "$fromFace face"
		set to "$toPoint point"
	}
	return [angledMirror $x $y $orientation $from $to 3]
}

proc symmetrical_threeway {x y orientation link} {
	set size [::grid::get tile_pixels]
	set tSize [expr {$size/2}]

	foreach arm $link {
		set from "[point $orientation $arm 1] point"
		lappend items [block $x $y $orientation $from 2]
	}

	switch -- $orientation {
		"standing" {
			set tY $y
			if {[lsearch $link w]>=0} {
				set tX [expr {$x-$tSize/$::Q3}]
				set tOrientation "w"
			} else {
				set tX [expr {$x+$tSize/$::Q3}]
				set tOrientation "e"
			}
		}
		"flat" {
			set tX $x
			if {[lsearch $link n]>=0} {
				set tY [expr {$y-$tSize/$::Q3}]
				set tOrientation "n"
			} else {
				set tY [expr {$y+$tSize/$::Q3}]
				set tOrientation "s"
			}
		}
	}

	# draw reflector
	lappend items [::geometry::equilateralTriangle $tX $tY $tOrientation $tSize -fill #$::mirrorColour]

	return $items
}

proc adjacent_threeway {x y orientation link} {
	set fromFace [lindex $link 0]
	while 1 {
		set fromFace [face $orientation $fromFace 1]
		if {[lsearch $link $fromFace]<0} break
	}
	set toFace [face $orientation $fromFace 2]

	return [angledMirror $x $y $orientation "$fromFace face" "$toFace face" 4]
}

proc double_adjacent_mirror {x y orientation link} {
	if {[face $orientation [lindex $link 0] 1]==[lindex $link 1]} {
		set fromFace [face $orientation [lindex $link 1] 1]
		set toFace   [face $orientation [lindex $link 1] 4]
	} else {
		set fromFace [face $orientation [lindex $link 0] 1]
		set toFace   [face $orientation [lindex $link 0] 4]
	}
	return [double_mirror $x $y $orientation "$fromFace face" "$toFace face"]
}

proc double_obtuse_mirror {x y orientation link} {
	if {[face $orientation [lindex $link 0] 2]==[lindex $link 1]} {
		set fromPoint [point $orientation [lindex $link 1] 1]
		set toPoint   [point $orientation [lindex $link 1] 4]
	} else {
		set fromPoint [point $orientation [lindex $link 0] 1]
		set toPoint   [point $orientation [lindex $link 0] 4]
	}
	return [double_mirror $x $y $orientation "$fromPoint point" "$toPoint point"]
}

proc adjacent_double_adjacent {x y orientation link1 link2} {
	set size [::grid::get tile_pixels]
	set mWidth [expr {$size/6}]
	set bWidth [expr {max($mWidth/2,1)}]

	set faces [concat $link1 $link2]
	set face [lindex $faces 0]
	while 1 {
		set face [face $orientation $face 1]
		if {[lsearch $faces $face]<0} break
	}
	set fromPoint [point $orientation $face 6]
	set toPoint [point $orientation $face 2]
	set midPoint [point $orientation $face 4]

	set from "$fromPoint point"
	set to "$toPoint point"
	set mid "$midPoint point"

	lassign [coordinate $x $y $orientation $from] x1 y1
	lassign [coordinate $x $y $orientation $to] x2 y2
	lassign [coordinate $x $y $orientation $mid] x3 y3

	lappend items [::geometry::line $x $y $x1 $y1 $mWidth -fill #$::mirrorColour]
	lappend items [::geometry::line $x $y $x2 $y2 $mWidth -fill #$::mirrorColour]
	lappend items [::geometry::line $x $y $x3 $y3 $mWidth -fill #$::mirrorColour]
	lappend items [::geometry::line $x $y $x3 $y3 $bWidth -fill #$::blockColour]
	lappend items [block $x $y $orientation $from 4]

	return $items
}

proc adjacent_and_obtuse {x y orientation link1 link2} {
	set size [::grid::get tile_pixels]

	set mirrorWidth [expr {max($size/6,2)}]
	set blockWidth [expr {max($mirrorWidth/2,1)}]

	if {[face $orientation [lindex $link1 0] 1]==[lindex $link1 1]
	|| [face $orientation [lindex $link1 1] 1]==[lindex $link1 0]} {
		set adjacentLink $link1
		set obtuseLink $link2
	} else {
		set adjacentLink $link2
		set obtuseLink $link1
	}

	if {[lsearch $obtuseLink [face $orientation [lindex $adjacentLink 0] 3]]>=0} {
		set adjacentFace [lindex $adjacentLink 0]
	} else {
		set adjacentFace [lindex $adjacentLink 1]
	}

	if {[lsearch $obtuseLink [face $orientation $adjacentFace 1]]>=0} {
		set fromPoint [point $orientation $adjacentFace 4]
		set toPoint [point $orientation $adjacentFace 5]
		set midPoint [point $orientation $adjacentFace 1]
	} else {
		set fromPoint [point $orientation $adjacentFace 2]
		set toPoint [point $orientation $adjacentFace 3]
		set midPoint [point $orientation $adjacentFace 6]
	}

	set from "$fromPoint point"
	set to "$toPoint point"
	set mid "$midPoint point"

	lassign [coordinate $x $y $orientation $from] x1 y1
	lassign [coordinate $x $y $orientation $to] x2 y2
	lassign [coordinate $x $y $orientation $mid] x3 y3

	lappend items [::geometry::line $x $y $x1 $y1 $mirrorWidth -fill #$::mirrorColour]
	lappend items [::geometry::line $x $y $x2 $y2 $mirrorWidth -fill #$::mirrorColour]
	lappend items [::geometry::line $x $y $x3 $y3 $mirrorWidth -fill #$::mirrorColour]
	lappend items [::geometry::line $x $y $x3 $y3 $blockWidth -fill #$::blockColour]
	lappend items [block $x $y $orientation $from 2]

	return $items
}

proc triple_adjacent_mirror {x y orientation link} {
	set size [::grid::get tile_pixels]

	set mirrorWidth [expr {max($size/6,2)}]
	set blockWidth [expr {max($mirrorWidth/2,1)}]

	if {[face $orientation [lindex $link 0] 1]==[lindex $link 1]} {
		set face [lindex $link 0]
	} else {
		set face [lindex $link 1]
	}

	set point1 [point $orientation $face 2]
	set point2 [point $orientation $face 4]
	set point3 [point $orientation $face 6]

	lassign [coordinate $x $y $orientation "$point1 point"] x1 y1
	lassign [coordinate $x $y $orientation "$point2 point"] x2 y2
	lassign [coordinate $x $y $orientation "$point3 point"] x3 y3

	lappend items [::geometry::line $x $y $x1 $y1 $mirrorWidth -fill #$::mirrorColour]
	lappend items [::geometry::line $x $y $x1 $y1 $blockWidth -fill #$::blockColour -width 0]
	lappend items [::geometry::line $x $y $x2 $y2 $mirrorWidth -fill #$::mirrorColour]
	lappend items [::geometry::line $x $y $x2 $y2 $blockWidth -fill #$::blockColour -width 0]
	lappend items [::geometry::line $x $y $x3 $y3 $mirrorWidth -fill #$::mirrorColour]
	lappend items [::geometry::line $x $y $x3 $y3 $blockWidth -fill #$::blockColour -width 0]

	return $items
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

proc angledMirror {x y orientation from to extent} {
	set size [::grid::get tile_pixels]

	set items {}
	set width [expr {$size/10}]

	lassign [coordinate $x $y $orientation $from] x1 y1
	lassign [coordinate $x $y $orientation $to] x2 y2

# logToFile "x1=$x1 x2=$x2 y1=$y1 y2=$y2"

	# draw mirror face and block
	lappend items [::geometry::line $x $y $x1 $y1 $width -fill #$::mirrorColour]
	lappend items [::geometry::line $x $y $x2 $y2 $width -fill #$::mirrorColour]
	lappend items [block $x $y $orientation $from $extent]

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
	set triangleSize [expr {$size/2}]

	switch -- $orientation {
		"standing" {
			set orientation1 "w"
			set x1 [expr {$x-$triangleSize/$::Q3}]
			set y1 $y
			set orientation2 "e"
			set x2 [expr {$x+$triangleSize/$::Q3}]
			set y2 $y
		}
		"flat" {
			set orientation1 "n"
			set x1 $x
			set y1 [expr {$y-$triangleSize/$::Q3}]
			set orientation2 "s"
			set x2 $x
			set y2 [expr {$y+$triangleSize/$::Q3}]
		}
	}

	lappend items [::geometry::equilateralTriangle $x1 $y1 $orientation1 $triangleSize -fill #$::mirrorColour]
	lappend items [::geometry::equilateralTriangle $x2 $y2 $orientation2 $triangleSize -fill #$::mirrorColour]

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

proc filter {x y orientation link colour} {
	set size [::grid::get tile_pixels]
	set fWidth [expr {2*$size/3}]
	set bWidth $size

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

proc prism {x y orientation main_face prism_orientation} {
	set size [::grid::get tile_pixels]

	# the prism is drawn as a triangle
	# first point of the triangle is the midpoint of the line between the main face and the second point away
	if {$prism_orientation=="left"} {
		set point [point $orientation $main_face 2]
	} else {
		set point [point $orientation $main_face 5]
	}
	lassign [coordinate $x $y $orientation "$main_face face"] xf yf
	lassign [coordinate $x $y $orientation "$point point"] xp yp
	set x1 [expr {$xf + ($xp-$xf)/2}]
	set y1 [expr {$yf + ($yp-$yf)/2}]

	# second point is 1/4 of the way along the line between the main face and the next point
	if {$prism_orientation=="left"} {
		set point [point $orientation $main_face 2]
	} else {
		set point [point $orientation $main_face 4]
	}
	lassign [coordinate $x $y $orientation "$point point"] xp yp
	set x2 [expr {$xf + ($xp-$xf)/4}]
	set y2 [expr {$yf + ($yp-$yf)/4}]

	# third point is 4/5 of the way between the green face and the point after the red face
	if {$prism_orientation=="left"} {
		set green_face [face $orientation $main_face 2]
		set point [point $orientation $green_face 2]
	} else {
		set green_face [face $orientation $main_face 4]
		set point [point $orientation $green_face 5]
	}
	lassign [coordinate $x $y $orientation "$green_face face"] xf yf
	lassign [coordinate $x $y $orientation "$point point"] xp yp
	set x3 [expr {$xf + 4*($xp-$xf)/5}]
	set y3 [expr {$yf + 4*($yp-$yf)/5}]

	lappend items [::geometry::polygon $x1 $y1 $x2 $y2 $x3 $y3 -fill #$::mirrorColour -width 0]
	return $items
}

}