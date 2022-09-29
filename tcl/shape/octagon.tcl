
namespace eval ::octagon {

variable face {}
variable point {}
variable coordinate {}

proc new_grid {} {
	variable faces
	variable points
	variable face {}
	variable point {}
	variable coordinate {}

	set faces {n ne e se s sw w nw}
	set points {nne nee see sse ssw sww nww nnw}

	# set the values in the face and point dicts

	# first from each face to each other face and to each point
	set count 0
	foreach fromFace $faces {
		set rotation 0
		while {$rotation<8} {
			set index [expr {($count+$rotation)%8}]
			set toFace [lindex $faces $index]
			set toPoint [lindex $points $index]
			dict set face $fromFace $rotation $toFace

			incr rotation
			dict set point $fromFace $rotation $toPoint
		}
		incr count
	}

	# then from each point to each other point and to each face
	set count 0
	foreach fromPoint $points {
		for {set rotation 0} {$rotation<8} {incr rotation} {
			set index [expr {($count+$rotation)%8}]
			set toPoint [lindex $points $index]
			dict set point $fromPoint $rotation $toPoint
		}

		for {set rotation 1} {$rotation<=8} {incr rotation} {
			set index [expr {($count+$rotation)%8}]
			set toFace [lindex $faces $index]
			dict set face $fromPoint $rotation $toFace
		}
		incr count
	}

	set size [::grid::get tile_pixels]
	dict set coordinate "n face"    x 0
	dict set coordinate "n face"    y [expr {0 - (1+$::Q2)*$size/2}]
	dict set coordinate "nne point" x [expr {0 + $size/2}]
	dict set coordinate "nne point" y [expr {0 - (1+$::Q2)*$size/2}]
	dict set coordinate "ne face"   x [expr {0 + (1+$::Q2)*$size/(2*$::Q2)}]
	dict set coordinate "ne face"   y [expr {0 - (1+$::Q2)*$size/(2*$::Q2)}]
	dict set coordinate "nee point" x [expr {0 + (1+$::Q2)*$size/2}]
	dict set coordinate "nee point" y [expr {0 - $size/2}]
	dict set coordinate "e face"    x [expr {0 + (1+$::Q2)*$size/2}]
	dict set coordinate "e face"    y 0
	dict set coordinate "see point" x [expr {0 + (1+$::Q2)*$size/2}]
	dict set coordinate "see point" y [expr {0 + $size/2}]
	dict set coordinate "se face"   x [expr {0 + (1+$::Q2)*$size/(2*$::Q2)}]
	dict set coordinate "se face"   y [expr {0 + (1+$::Q2)*$size/(2*$::Q2)}]
	dict set coordinate "sse point" x [expr {0 + $size/2}]
	dict set coordinate "sse point" y [expr {0 + (1+$::Q2)*$size/2}]
	dict set coordinate "s face"    x 0
	dict set coordinate "s face"    y [expr {0 + (1+$::Q2)*$size/2}]
	dict set coordinate "ssw point" x [expr {0 - $size/2}]
	dict set coordinate "ssw point" y [expr {0 + (1+$::Q2)*$size/2}]
	dict set coordinate "sw face"   x [expr {0 - (1+$::Q2)*$size/(2*$::Q2)}]
	dict set coordinate "sw face"   y [expr {0 + (1+$::Q2)*$size/(2*$::Q2)}]
	dict set coordinate "sww point" x [expr {0 - (1+$::Q2)*$size/2}]
	dict set coordinate "sww point" y [expr {0 + $size/2}]
	dict set coordinate "w face"    x [expr {0 - (1+$::Q2)*$size/2}]
	dict set coordinate "w face"    y 0
	dict set coordinate "nww point" x [expr {0 - (1+$::Q2)*$size/2}]
	dict set coordinate "nww point" y [expr {0 - $size/2}]
	dict set coordinate "nw face"   x [expr {0 - (1+$::Q2)*$size/(2*$::Q2)}]
	dict set coordinate "nw face"   y [expr {0 - (1+$::Q2)*$size/(2*$::Q2)}]
	dict set coordinate "nnw point" x [expr {0 - $size/2}]
	dict set coordinate "nnw point" y [expr {0 - (1+$::Q2)*$size/2}]
}

proc face {from by} {
	variable face
	return [dict get $face $from $by]
}

proc point {from by} {
	variable point
	return [dict get $point $from $by]
}

proc coordinate {centrex centrey position} {
	variable coordinate

	if {![dict exists $coordinate $position x]} {
		return [list $centrex $centrey]
	}

	set x [expr {$centrex + [dict get $coordinate $position x]}]
	set y [expr {$centrey + [dict get $coordinate $position y]}]

	return [list $x $y]
}

proc directions {orientation} {
	variable faces
	return $faces
}

# return next (clockwise) direction
proc next_direction {orientation direction} {
	variable face
	return [dict get $face $direction 1]
}

proc opposite_direction {orientation direction} {
	variable face
	return [dict get $face $direction 4]
}

proc random_direction {orientation} {
	variable faces
	return [lindex $faces [expr {int(rand()*8)}]]
}

proc rotate_arm {orientation arm by} {
	variable face
	return [dict get $face $arm [expr {$by%8}]]
}

proc add_arm_connector_type {x y link_id arm} {
	set old_connector_type [::tile::get connector_type]
	set link [::tile::link $link_id]

	switch -- $old_connector_type {
		"" {
			set existing_arm [lindex $link 0]
			if {[face $existing_arm 4]==$arm} {
				return "straight"
			} elseif {[face $existing_arm 2]==$arm || [face $existing_arm 6]==$arm} {
				return "right-mirror"
			} else {
				return "versatile-mirror"
			}
		}
		"straight" {
			if {[::tile::get links]>1} { return "" }

			set right_face [face $arm 2]
			if {[lsearch $link $right_face]>=0} {
				return "regular-threeway"
			} else {
				return "irregular-threeway"
			}
		
		}
		"right-mirror" {
			if {[contains_opposite_face $link $arm]} {
				# Regular threeway
				return "regular-threeway"
			} elseif {[adjacent_faces $link $arm]==2} {
				# Adjacent Threeway
				return "adjacent-threeway"
			} else {
				# Not supported
				return ""
			}
		}
		"versatile-mirror" {
			if {[::tile::get links]>1} { return "" }

			if {[adjacent_faces $link [lindex $link 0]]==1} {
				# Existing link is adjacent pair
				if {[contains_opposite_face $link $arm]} {
					# Irregular threeway
					return "irregular-threeway"
				} elseif {[adjacent_faces $link $arm]==1} {
					# Adjacent Threeway
					return "adjacent-threeway"
				} else {
					# Not supported
					return ""
				}
			} else {
				# Existing link is obtuse pair
				if {[contains_opposite_face $link $arm]} {
					# Irregular threeway
					return "irregular-threeway"
				} else {
					# Not supported
					return ""
				}
			}
		}
 		"regular-threeway" {
			if {[contains_opposite_face $link $arm]} {
				# Regular fourway
				return "regular-fourway"
			} elseif {[adjacent_faces $link $arm]==2} {
				# Almost an adjacent fourway
				return "almost-adjacent-fourway"
			} else {
				return "irregular-fourway"
			}
		}
		"irregular-threeway" {
			if {[contains_opposite_face $link $arm]} {
				# Scissors
				return "scissors-fourway"
			} elseif {[adjacent_faces $link $arm]==0} {
				# Irregular fourway
				return "irregular-fourway"
			}

			set opposite_face [face $arm 4]
			if {[adjacent_faces $link $opposite_face]==0} {
				# Almost an adjacent
				return "almost-adjacent-fourway"
			}

			set first_adjacent_face [face $arm 1]
			set second_adjacent_face [face $arm 7]
			if {[adjacent_faces $link $first_adjacent_face]==0 || [adjacent_faces $link $second_adjacent_face]==0} {
				# Peace
				return "peace-fourway"
			} else {
				# Anti-peace
				return "inverted-peace-fourway"
			}
		}
		"adjacent-threeway" {
			if {![contains_opposite_face $link $arm]} {
				# Adjacent
				return "adjacent-fourway"
			} 

			set opposite_face [face $arm 4]
			if {[adjacent_faces $link $opposite_face]==2} {
				# Peace
				return "peace-fourway"
			} else {
				return "almost-adjacent-fourway"
			}
		}
		"regular-fourway" { return "regular-fiveway" }
		"irregular-fourway" {
			if {[contains_opposite_face $link $arm]} {
				if {[adjacent_faces $link $arm]==2} {
					return "irregular-fiveway"
				} else {
					return "regular-fiveway"
				}
			} elseif {[adjacent_faces $link $arm]==2} {
				return "almost-adjacent-fiveway"
			} else {
				return "nuclear-fiveway"
			}
		}
		"unnamed-fourway" {
			# shouldn't happen
			...
		}
		"scissors-fourway" { return "irregular-fiveway" }
		"inverted-peace-fourway" {
			if {[contains_opposite_face $link $arm]} {
				return "irregular-fiveway"
			} elseif {[adjacent_faces $link $arm]==2} {
				return "adjacent-fiveway"
			} else {
				return "nuclear-fiveway"
			}
		}
		"peace-fourway" {
			if {[contains_opposite_face $link $arm]} {
				return "irregular-fiveway"
			} else {
				return "almost-adjacent-fiveway"
			}
		}
		"almost-adjacent-fourway" {
			if {[contains_opposite_face $link $arm]} {
				if {[adjacent_faces $link $arm]==1} {
					return "irregular-fiveway"
				} else {
					return "regular-fiveway"
				}
			} elseif {[adjacent_faces $link $arm]==2} {
				return "adjacent-fiveway"
			} else {
				return "nuclear-fiveway"
			}
		}
		"adjacent-fourway" {
			if {[adjacent_faces $link $arm]==1} {
				return "adjacent-fiveway"
			} else {
				return "almost-adjacent-fiveway"
			}
		}
		"regular-fiveway" {
			if {[contains_opposite_face $link $arm]} {
				return "regular-sixway"
			} else {
				return "tree-sixway"
			}
		}
		"irregular-fiveway" {
			if {[contains_opposite_face $link $arm]} {
				return "regular-sixway"
			} elseif {[adjacent_faces $link $arm]==2} {
				return "adjacent-sixway"
			} else {
				return "irregular-sixway"
			}
		}
		"nuclear-fiveway" {	
			set opposite_face [face $arm 4]
			if {[adjacent_faces $link $opposite_face]==0} {
				return "tree-sixway"
			} else {
				return "irregular-sixway"
			}
		}
		"almost-adjacent-fiveway" {
			if {[adjacent_faces $link $arm]==2} {
				return "adjacent-sixway"
			}

			set opposite_face [face $arm 4]
			if {[adjacent_faces $link $opposite_face]==2} {
				return "irregular-sixway"
			} else {
				return "tree-sixway"
			}
		}
		"adjacent-fiveway" {
			if {[adjacent_faces $link $arm]==0} {
				return "tree-sixway"
			} else {
				return "adjacent-sixway"
			}
		}

		"regular-sixway" { return "sevenway" }
		"irregular-sixway" { return "sevenway" }
		"tree-sixway" { return "sevenway" }
		"adjacent-sixway" { return "sevenway" }

		"sevenway" { return "eightway" }
		"double-versatile-mirror" { return "" }
		"double-right-mirror" { return "" }
		default {error "attempt to add $arm arm to link $link_id on tile @ $x,$y\n[::tile::dump]"}
	}
}

proc remove_arm_connector_type {x y link_id arm} {
	set old_connector_type [::tile::get connector_type]
	set link [::tile::link $link_id]

	switch -- $old_connector_type {
		"eightway" {return "sevenway"}
		"sevenway" {
			if {![contains_opposite_face $link $arm]} {
				return "regular-sixway"
			} elseif {[adjacent_faces $link $arm]==1} {
				return "adjacent-sixway"
			}

			set opposite_face [face $arm 4]
			if {[adjacent_faces $link $opposite_face]==2} {
				return "tree-sixway"
			} else {
				return "irregular-sixway"
			}
		}
		"regular-sixway" {
			if {[adjacent_faces $link $arm]==2} {
				return "regular-fiveway"
			} else {
				return "irregular-fiveway"
			}
		}
		"irregular-sixway" {
			if {![contains_opposite_face $link $arm]} {
				return "irregular-fiveway"
			} elseif {[adjacent_faces $link $arm]==2} {
				return "nuclear-fiveway"
			} else {
				return "almost-adjacent-fiveway"
			}
		}
		"tree-sixway" {
			if {![contains_opposite_face $link $arm]} {
				return "regular-fiveway"
			} else {
				switch --[adjacent_faces $link $arm] {
					0 { return "adjacent-fiveway" }
					1 { return "almost-adjacent-fiveway" }
					2 { return "nuclear-fiveway" }
				}
			}
		}
		"adjacent-sixway" {
			if {![contains_opposite_face $link $arm]} {
				return "irregular-fiveway"
			} elseif {[adjacent_faces $link $arm]==2} {
				return "almost-adjacent-fiveway"
			} else {
				return "adjacent-fiveway"
			}
		}
		"regular-fiveway" {
			if {![contains_opposite_face $link $arm]} {
				return "regular-fourway"
			} elseif {[adjacent_faces $link $arm]==0} {
				return "almost-adjacent-fourway"
			} else {
				return "irregular-fourway"
			}
		}
		"irregular-fiveway" {
			if {![contains_opposite_face $link $arm]} {
				return "scissors-fourway"
			} elseif {[adjacent_faces $link $arm]==2} {
				return "irregular-fourway"
			}

			set opposite_face [face $arm 4]
			if {[adjacent_faces $link $opposite_face]==2} {
				return "almost-adjacent-fourway"
			}

			set first_adjacent_face [face $arm 1]
			set second_adjacent_face [face $arm 7]
			if {[adjacent_faces $link $first_adjacent_face]==2 || [adjacent_faces $link $second_adjacent_face]==2} {
				return "inverted-peace-fourway"
			} else {
				return "peace-fourway"
			}
		}
		"nuclear-fiveway" {
			if {![contains_opposite_face $link $arm]} {
				return "irregular-fourway"
			} elseif {[adjacent_faces $link $arm]==0} {
				return "inverted-peace-fourway"
			} else {
				# Unnamed
				return ""
			}
		}
		"almost-adjacent-fiveway" {
			if {[contains_opposite_face $link $arm]} {
				if {[adjacent_faces $link $arm]==0} {
					return "adjacent-fourway"
				} else {
					# Unnamed
					return ""
				}
			} elseif {[adjacent_faces $link $arm]==2} {
				return "irregular-fourway"
			}

			set opposite_face [face $arm 4]
			if {[adjacent_faces $link $opposite_face]==2} {
				return "almost-adjacent-fourway"
			} else {
				return "peace-fourway"
			}
		}
		"adjacent-fiveway" {
			if {[contains_opposite_face $link $arm]} {
				return "adjacent-fourway"
			}

			set opposite_face [face $arm 4]
			if {[adjacent_faces $link $opposite_face]==0} {
				return "inverted-peace-fourway"
			} else {
				return "almost-adjacent-fourway"
			}
		}
		"regular-fourway" { return "regular-threeway" }
		"irregular-fourway" {
			if {[contains_opposite_face $link $arm]} {
				return ""
			} elseif {[adjacent_faces $link $arm]==0} {
				return "irregular-threeway"
			} else {
				return "regular-threeway"
			}
		}
		"unnamed-fourway" {...}
		"scissors-fourway" { return "irregular-threeway" }
		"inverted-peace-fourway" {
			if {[contains_opposite_face $link $arm]} {
				return ""
			} else {
				return "irregular-threeway"
			}
		}
		"peace-fourway" {
			if {![contains_opposite_face $link $arm]} {
				return "irregular-threeway"
			} elseif {[adjacent_faces $link $arm]==0} {
				return "adjacent-threeway"
			} else {
				return ""
			}
		}
		"almost-adjacent-fourway" {
			if {[contains_opposite_face $link $arm]} {
				if {[adjacent_faces $link $arm]==0} {
					return "adjacent-threeway"
				} else {
					return ""
				}
			} elseif {[adjacent_faces $link $arm]==2} {
				return "regular-threeway"
			} else {
				return "irregular-threeway"
			}
		}
		"adjacent-fourway" {
			if {[adjacent_faces $link $arm]==1} {
				return "adjacent-threeway"
			} else {
				return ""
			}
		}
		"regular-threeway" {
			if {[contains_opposite_face $link $arm]} {
				return "right-mirror"
			} else {
				return "straight"
			}
		}
		"irregular-threeway" {
			if {[contains_opposite_face $link $arm]} {
				return "versatile-mirror"
			} else {
				return "straight"
			}
		}
		"adjacent-threeway" {
			if {[adjacent_faces $link $arm]==2} {
				return "right-mirror"
			} else {
				return "versatile-mirror"
			}
		}
		default {error "attempt to remove $arm arm from link $link_id on tile @ $x,$y\n[::tile::dump]"}
	}
}

# link must contain exactly 2 arms
proc add_link_connector_type {x y link} {
	set old_connector_type [::tile::get connector_type]

	switch -- $old_connector_type {
		"straight" {
			# new link must also be straight
			if {[face [lindex $link 0] 4]==[lindex $link 1]} {
				return "straight"
			} else {
				return ""
			}
		}
		"right-mirror" {
			set existing_link [::tile::link [lindex [::tile::get all_link_ids] 0]]
			foreach arm $link {
				if {![contains_opposite_face $existing_link $arm]} {
					return ""
				}
			}

			return "double-right-mirror"
		}
		"versatile-mirror" {
			set first_arm [lindex $link 0]
			set second_arm [lindex $link 1]

			if {[face $first_arm 1]==$second_arm || [face $second_arm 1]==$first_arm} {
				set new_link_type "adjacent"
			} elseif {[face $first_arm 3]==$second_arm || [face $second_arm 3]==$first_arm} {
				set new_link_type "obtuse"
			} else {
				return ""
			}

			if {[::tile::get links]==1} {
				set existing_link [::tile::link [lindex [::tile::get all_link_ids] 0]]
				set first_arm_adjacent [adjacent_faces $existing_link $first_arm]
				set second_arm_adjacent [adjacent_faces $existing_link $second_arm]
				set first_arm_opposite [contains_opposite_face $existing_link $first_arm]
				set second_arm_opposite [contains_opposite_face $existing_link $second_arm]

				if {[adjacent_faces $existing_link [lindex $existing_link 0]]==1} {
					# existing link is adjacent
					if {$new_link_type=="obtuse" && $first_arm_adjacent && $second_arm_adjacent} {
						return "versatile-mirror"
					} elseif {$new_link_type=="adjacent" && $first_arm_opposite && $second_arm_opposite} {
						return "double-versatile-mirror"
					} elseif {$new_link_type=="obtuse" && !$first_arm_adjacent && !$first_arm_opposite && !$second_arm_adjacent && !$second_arm_opposite} {
						return "double-versatile-mirror"
					} else {
						return ""
					}
				} else {
					# existing link is obtuse
					if {$new_link_type=="obtuse" && $first_arm_opposite && $second_arm_opposite} {
						return "double-versatile-mirror"
					} elseif {$new_link_type=="adjacent" && !$first_arm_opposite && !$second_arm_opposite && $first_arm_adjacent && $second_arm_adjacent} {
						return "versatile-mirror"
					} elseif {$new_link_type=="adjacent" && !$first_arm_adjacent && !$second_arm_adjacent} {
						return "double-versatile-mirror"
					} else {
						return ""
					}
				}
			} else {
				set first_opposite [face $first_arm 4]
				set second_opposite [face $second_arm 4]
				if {[::tile::link_ids $first_opposite]==[::tile::link_ids $second_opposite]} {
					return "double-versatile-mirror"
				} else {
					return ""
				}
			}
		}
		"regular-threeway" { return "" }
		"irregular-threeway" { return "" }
		"adjacent-threeway" { return "" }
		"regular-fourway" { return "" }
		"irregular-fourway" { return "" }
		"unnamed-fourway" { return "" }
		"scissors-fourway" { return "" }
		"inverted-peace-fourway" { return "" }
		"peace-fourway" { return "" }
		"almost-adjacent-fourway" { return "" }
		"adjacent-fourway" { return "" }
		"regular-fiveway" { return "" }
		"irregular-fiveway" { return "" }
		"nuclear-fiveway" { return "" }
		"almost-adjacent-fiveway" { return "" }
		"adjacent-fiveway" { return "" }
		"regular-sixway" { return "" }
		"irregular-sixway" { return "" }
		"tree-sixway" { return "" }
		"adjacent-sixway" { return "" }
		"double-right-mirror" { return "" }
		"double-versatile-mirror" {
			if {[::tile::get links]==3} {return "double-versatile-mirror"}

			set first_arm [lindex $link 0]
			set second_arm [lindex $link 0]

			if {[face $first_arm 1]==$second_arm || [face $second_arm 1]==$first_arm} {
				set new_link_type "adjacent"
			} elseif {[face $first_arm 3]==$second_arm || [face $second_arm 3]==$first_arm} {
				set new_link_type "obtuse"
			} else {
				return ""
			}

			# there are two links. Either they are are both adjacent, both obtuse, or they are both different
			# pick one of the links (doesn't matter which)
			set existing_link [::tile::link [lindex [::tile::get all_link_ids] 0]]
			set arbitrary_opposite_face [face [lindex $existing_link 0] 4]
			if {[::tile::link_ids $arbitrary_opposite_face]!={}} {
				# both the same
				# check if both arms of new link are adjacent (or not adjacent)
				if {[adjacent_faces $existing_link $first_arm]==[adjacent_faces $existing_link $second_arm]} {
					return "double-versatile-mirror"
				} else {
					return ""
				}
			} else {
				# both different
				# check if both arms of the new link are opposite (or not opposite)
				if {[contains_opposite_face $existing_link $first_arm]==[contains_opposite_face $existing_link $second_arm]} {
					return "double-versatile-mirror"
				} else {
					return ""
				}
			}
		}
		default {error "attempt to add link $link to tile @ $x,$y\n[::tile::dump]"}
	}
}

proc remove_link_connector_type {x y link_id} {	return "" }

# return true if the link cotains the face opposite the given arm
proc contains_opposite_face {link arm} {
	set opposite_face [face $arm 4]
	return [expr {[lsearch $link $opposite_face]>=0}]	
}

# return the number of faces adjacent to the given arm that are contained in the link (0,1 or 2)
proc adjacent_faces {link arm} {
	set first_adjacent_face [face $arm 1]
	set second_adjacent_face [face $arm 7]
	incr adjacent_faces [expr {[lsearch $link $first_adjacent_face]>=0}]
	incr adjacent_faces [expr {[lsearch $link $second_adjacent_face]>=0}]
	return $adjacent_faces
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
		4 {set description "Quad source: $colour"}
		5 {set description "Quint source: $colour"}
		6 {set description "Hex source: $colour"}
		7 {set description "Hept source: $colour"}
		8 {set description "Oct source: $colour"}
	}

	::tile::set description $description
	::tile::set complete 1
}

proc update_connector {x y} {
	set description ""
	set fg_items {}
	set bg_items {}

	set connector_type [::tile::get connector_type]

	switch -- $connector_type {
		"straight" { 
			# nothing
			set description "Empty"
		}
		"right-mirror" {
			# A one-sided mirror that reflects light beams soming in at a 45-degree angle to the face. The reflected beam is at a 90-degree angle to the incoming beam. One link with 2 arms. One dead arm
			set description "Right Mirror"
		}
		"versatile-mirror" {
			# A one-sided mirror that reflects incoming light at a 67.5 degree angle, the resulting beam exits 45 degrees; also reflects incoming light at a 22.5 degree angle, the resulting beam of this exits at 135 degrees to the incoming. Two links, each with two arms. Can be converted into a prism
			set description "Versatile Mirror"
		}
		"regular-threeway" {
			# A reflective 90-degree point that covers one face, and one half of the two adjacent faces. Incoming light passes through in a straight line and reflects out at a 90-degree angle also. One link with 3 arms. Two dead arms
			set description "Regular Threeway"
		}
 		"irregular-threeway" {
			# A reflective 90-degree point that allows incoming beams to pass through, and also reflects light at a 45/135-degree angle, depending which direction. There are two links, each with 3 arms. The block occupies two adjacent faces, all 6 remaining faces are part of an active link
			set description "Irregular Threeway"
			# NOTE: Only one link will ever be used by a puzzle...
		}
		"adjacent-threeway" {
			# # An inverted block that covers 5 faces. The remaining 3 faces are part of the same link. 
			set description "Adjacent Threeway"
		}
		"regular-fourway" {
			# star/diamond with four regularly spaced blocks each occupying a face. One link with four arms.
			set description "Regular Fourway"
		}
		"irregular-fourway" {
			# One block covering 2 faces, adjacent to an adjacent pair of open faces. 2 smaller blocks covering a face each. Has two orientations
			set description "Almost Regular Fourway"
		}
		"unnamed-fourway" {
			# One block covers 2 faces, opposite two adjacent open faces
			# Almost impossible for one of these to occour, because there is no threeway that can evolve into it. Has to devolve from a fiveway.
			set description "Semi-Adjacent Fourway"
		}
		"scissors-fourway" {
			# Star with 2 opposing blocks that occupy 2 faces apiece.
			set description "Peace Fourway"
		}
		"inverted-peace-fourway" {
			# One block covers 3 faces, a smaller block covers the opposite face. Remaining faces linked via a star.
			set description "Semi-Adjacent Fourway"
		}
		"almost-adjacent-fourway" {
			# One block covering 3 faces, smaller block covering one of the two faces not adjacent or opposite. Has two orientations
			set description "Almost Adjacent Fourway"
		}
		"peace-fourway" {
			# Star with 2 blocks that occupy 2 faces apiece. There is one free space between the two blocks. One link with four arms 
			set description "Peace Fourway"
		}
		"adjacent-fourway" {
			# Similar to a versatile mirror, except the two links are combined into one via a star. one link with four arms. Can be converted into a prism
			set description "Adjacent Fourway"
		}
		"regular-fiveway" {
			# Three blocks, spaced evenly with a single open face between each of them
			set description "Regular Fiveway"
		}
		"irregular-fiveway" {
			# One block covering 2 faces, another block covering a single face. In between are two adjacent open faces. Two orientations
			set description "Fiveway"
		}
		"nuclear-fiveway" {
			# Three blocks, spaced evenly with two adjacent open faces between each of them
			set description "Regular Fiveway"
		}
		"almost-adjacent-fiveway" {
			# One block covering 2 faces, another block covering a single face. In between is a single open face. Two orientations
			set description "Almost Adjacent Fiveway"
		}
		"adjacent-fiveway" {
			# One block covering 3 faces, remaining 5 part of the link
			set description "Adjacent Fiveway"
		}
		"regular-sixway" {
			# Two opposing blocks covering a single face each
			set description "Regular Sixway"
		}
		"irregular-sixway" {
			# Two blocks covering a single face each, separated by two adjacent open faces
			set description "Irregular Sixway"
		}
		"tree-sixway" {
			# Two blocks covering a single face each, separated by a single open face
			set description "Almost Adjacent Sixway"
		}
		"adjacent-sixway" {
			# Single block covering two adjacent faces
			set description "Adjacent Sixway"
		}
		"sevenway" {
			# A single block covering a single face
			set description "Sevenway"
		}
		"eightway" {
			# Just a star
			set description "Eightway"
		}
		"double-versatile-mirror" {
			# double-sided mirror. All eight faces link to another face
			set description "Double Versatile Mirror"
		}
		"double-right-mirror" {
			# double sided right mirror. Two links
			set description "Double Right Mirror"
		}
		default {
			set description "Unknown ($connector_type)"
		}
	}

	::tile::set description $description
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

	switch -- $type {
		"straight" {
			# add extra links that pass through...
			foreach direction [directions ""] {
				if {[::tile::link_ids $direction]!={}} { continue }
				set new_link {}
				lappend new_link $direction [face $direction 4]
				::tile::new_link $new_link
			}
		}
		"right-mirror" {
			# Add a dead link between the two linked faces...
			set link [::tile::link [lindex [::tile::get all_link_ids] 0]]
			if {[face [lindex $link 0] 2]==[lindex $link 1]} {
				set arm [face [lindex $link 0] 1]
			} else {
				set arm [face [lindex $link 1] 1]
			}
			set new_link [list $arm]
			::tile::new_link $new_link
		}
		"versatile-mirror" {
			# Add remaining adjacent/obtuse link
			if {[::tile::get links]==1} {
				set link [::tile::link [lindex [::tile::get all_link_ids] 0]]
				lassign $link first_arm second_arm
				set new_link {}
				if {[face $first_arm 1]==$second_arm} {
					# existing link is adjacent
					lappend new_link [face $first_arm 7] [face $first_arm 2]
				} elseif {[face $second_arm 1]==$first_arm} {
					# existing link is adjacent
					lappend new_link [face $second_arm 7] [face $second_arm 2]
				} elseif {[face $first_arm 3]==$second_arm} {
					# existing link is obtuse
					lappend new_link [face $first_arm 1] [face $first_arm 2]
				} else {
					lappend new_link [face $second_arm 1] [face $second_arm 2]
				}
				::tile::new_link $new_link
			}
		}
 		"regular-threeway" {
			# Add two dead links...
			set link [::tile::link [lindex [::tile::get all_link_ids] 0]]
			foreach arm $link {
				if {[lsearch $link [face $arm 2]]<0} { continue }
				set new_link [list [face $arm 1]]
				::tile::new_link $new_link
			}
		}
		"irregular-threeway" {
			# Add a second three-armed link...
			set link [::tile::link [lindex [::tile::get all_link_ids] 0]]
			foreach arm $link {
				if {![contains_opposite_face $link $arm]} { break }
			}

			set new_link {}
			if {[lsearch $link [face $arm 7]]>=0} {
				lappend new_link [face $arm 1] [face $arm 2] [face $arm 6]
			} else {
				lappend new_link [face $arm 7] [face $arm 6] [face $arm 2]
			}
			::tile::new_link $new_link
		}
		"adjacent-threeway" {}
		"regular-fourway" {}
		"irregular-fourway" {}
		"unnamed-fourway" {}
		"scissors-fourway" {}
		"inverted-peace-fourway" {}
		"peace-fourway" {}
		"almost-adjacent-fourway" {}
		"adjacent-fourway" {}
		"regular-fiveway" {}
		"irregular-fiveway" {}
		"nuclear-fiveway" {}
		"almost-adjacent-fiveway" {}
		"adjacent-fiveway" {}
		"regular-sixway" {}
		"irregular-sixway" {}
		"tree-sixway" {}
		"adjacent-sixway" {}
		"sevenway" {}
		"eightway" {}
		"double-versatile-mirror" {
			# Add remaining adjacent/obtuse links
			if {[::tile::get links]<4} {
				set link [::tile::link [lindex [::tile::get all_link_ids] 0]]
				lassign $link first_arm second_arm
				for {set by 1} {$by<8} {incr by} {
					set first_new_arm [face $first_arm $by]
					if {[::tile::link_ids $first_new_arm]!={}} { continue }
					set second_new_arm [face $second_arm [expr {8-$by}]]
					if {[::tile::link_ids $first_new_arm]!={}} { error "link already exists on $second_new_arm but not on $first_new_arm:\n[::tile::dump]" }
					::tile::new_link [list $first_new_arm $second_new_arm]
				}
			}
		}
		"double-right-mirror" {
			# add two dead links...
			::tile::each_link {
				if {[face [lindex $link 0] 2]==[lindex $link 1]} {
					set arm [face [lindex $link 0] 1]
				} else {
					set arm [face [lindex $link 1] 1]
				}
				set new_link [list $arm]
				::tile::new_link $new_link
			}
		}
	}
}

proc finalise_filter {x y} {
	# add 6 dead links to this tile
	foreach direction [directions ""] {
		if {[::tile::link_ids $direction]!={}} continue
		set link {}
		lappend link $direction
		set link_id [::tile::new_link $link]
		::tile::link_filter $link_id ""
	}
}

proc finalise_prism {x y} {
	# add another 4 dead links to this tile
	foreach direction [directions ""] {
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
# change this so that only an almost-adjacent fourway can be converted into a prism
# this will actually increase the number of prisms because
# a) almost-adjacent is the most common type of fourway (>25% chance), whereas adjacent fourway is among the least common (<10% chance)
# b) versatile-mirrors that have the right combination of colours coming in are extremely rare
proc connector_to_prism {x y} {
	set connector_type [::tile::get connector_type]

	set faces {}

	switch -- $connector_type {
		"adjacent-fourway" {
			set faces [::tile::link [lindex [::tile::get all_link_ids] 0]]
		}
		"versatile-mirror" {
			if {[::tile::get links]==1} {return {}}
			::tile::each_link {	lappend faces {*}$link	}
			# bug: add_prism proc needs to check if the same source is involved more than once...
			# until fixed, just return {}
			# return {}
		}
		default { return {} }
	}

	set colours [::colour::primaries]
	set prism_face {}

	# find the earliest clockwise (left-most) face
	foreach face $faces {
		if {[lsearch $faces [face $face 7]]<0} { break }
	}

	set sorted_faces {}
	while {[llength $sorted_faces]<4} {
		lappend sorted_faces $face
		set face [face $face 1]
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
	::tile::add bg_items [::geometry::octagon $centrex $centrey $size -fill "" -outline white]
}

proc draw_source {x y centrex centrey} {
	set size [::grid::get tile_pixels]
	set colour [::tile::get colour]

	set blockSize $size
	set lightSize [expr {2*$blockSize/3}]

	::tile::add bg_items [::geometry::octagon $centrex $centrey $blockSize -fill #$::blockColour -width 0]
	::tile::add fg_items [::geometry::octagon $centrex $centrey $lightSize -fill #[colour::bright_rgb $colour]]
}

proc draw_connector {x y centrex centrey} {
	set connector_type [::tile::get connector_type]
	set link [::tile::link [lindex [::tile::get all_link_ids] 0]]

	switch -- $connector_type {
		"straight" 					{ # nothing }
		"right-mirror" 				{ ::tile::add fg_items {*}[right_mirror            $centrex $centrey $link] }
		"versatile-mirror" 			{ ::tile::add fg_items {*}[versatile_mirror         $centrex $centrey $link] }
 		"regular-threeway" 			{ ::tile::add fg_items {*}[regular_threeway        $centrex $centrey $link] }
		"irregular-threeway" 		{ ::tile::add fg_items {*}[irregular_threeway      $centrex $centrey $link] }
		"adjacent-threeway" 		{ ::tile::add fg_items {*}[adjacent_threeway       $centrex $centrey $link] }
		"regular-fourway" 			{ ::tile::add fg_items {*}[regular_fourway         $centrex $centrey $link] }
		"irregular-fourway" 		{ ::tile::add fg_items {*}[star_block              $centrex $centrey $link] }
		"unnamed-fourway"			{ # doesn't happen... }
		"scissors-fourway"			{ ::tile::add fg_items {*}[star_block              $centrex $centrey $link] }
		"inverted-peace-fourway"	{ ::tile::add fg_items {*}[star_block              $centrex $centrey $link] }
		"peace-fourway" 			{ ::tile::add fg_items {*}[star_block 		       $centrex $centrey $link] }
		"almost-adjacent-fourway" 	{ ::tile::add fg_items {*}[star_block              $centrex $centrey $link] }
		"adjacent-fourway" 			{ ::tile::add fg_items {*}[star_block              $centrex $centrey $link] }
		"regular-fiveway"			{ ::tile::add fg_items {*}[star_block              $centrex $centrey $link] }
		"irregular-fiveway" 		{ ::tile::add fg_items {*}[star_block              $centrex $centrey $link] }
		"nuclear-fiveway" 			{ ::tile::add fg_items {*}[star_block              $centrex $centrey $link] }
		"almost-adjacent-fiveway" 	{ ::tile::add fg_items {*}[star_block              $centrex $centrey $link] }
		"adjacent-fiveway"			{ ::tile::add fg_items {*}[star_block              $centrex $centrey $link] }
		"regular-sixway" 			{ ::tile::add fg_items {*}[star_block              $centrex $centrey $link] }
		"irregular-sixway" 			{ ::tile::add fg_items {*}[star_block              $centrex $centrey $link] }
		"tree-sixway" 				{ ::tile::add fg_items {*}[star_block              $centrex $centrey $link] }
		"adjacent-sixway" 			{ ::tile::add fg_items {*}[star_block              $centrex $centrey $link] }
		"sevenway" 					{ ::tile::add fg_items {*}[star_block              $centrex $centrey $link] }
		"eightway"					{ ::tile::add fg_items {*}[star                    $centrex $centrey] }
		"double-right-mirror" 		{ ::tile::add fg_items {*}[double_right_mirror     $centrex $centrey $link] }
		"double-versatile-mirror" 	{ ::tile::add fg_items {*}[double_versatile_mirror $centrex $centrey $link] }
	}
}

proc draw_filter {x y centrex centrey} {
	::tile::each_link { if {[llength $link]==2} { break } } 
	set colour [::tile::link_filter $link_id]

	::tile::add fg_items {*}[filter $centrex $centrey $link $colour]
}

proc draw_prism {x y centrex centrey} {
	set prism_orientation [::tile::get prism_orientation]

	foreach direction [directions "straight"] {
		if {[llength [::tile::link_ids $direction]]==3} { break }
	}
	set main_face $direction

	::tile::add fg_items {*}[prism $centrex $centrey $main_face $prism_orientation]
}

proc draw_node {x y centrex centrey} {
	set size [::grid::get tile_pixels]
	set diameter [::grid::get node_diameter]
	set colour [::tile::get colour]

	set width [expr {max(1,$size/10)}]

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
				lassign [coordinate $centrex $centrey $position] x1 y1
				::tile::add link_items [geometry::line $centrex $centrey $x1 $y1 $width -fill #[colour::bright_rgb $colour]]
			} 
		}
	}
}

proc draw_prism_links {x y centrex centrey} {
	set size [::grid::get tile_pixels]
	set width [::grid::get path_width]

	foreach arm [directions ""] {
		set colour_list {}
		foreach link_id [::tile::link_ids $arm] {
			lappend colour_list {*}[::tile::arm_colours $link_id $arm]
		}
		set colour [colour::combine [lsort -unique $colour_list]]
		if {$colour==""} continue

		set position "$arm face"
		lassign [coordinate $centrex $centrey $position] x1 y1
		::tile::add link_items [geometry::line $centrex $centrey $x1 $y1 $width -fill #[colour::bright_rgb $colour]]
	}
}

proc right_mirror {x y link} {
	if {[face [lindex $link 0] 2]==[lindex $link 1]} {
		set fromFace [face [lindex $link 1] 1]
		set toFace   [face [lindex $link 1] 5]
	} else {
		set fromFace [face [lindex $link 0] 1]
		set toFace   [face [lindex $link 0] 5]
	}
	return [mirror $x $y "$fromFace face" "$toFace face"]
}

proc versatile_mirror {x y link} {
	if {[face [lindex $link 0] 1]==[lindex $link 1]} {
		set fromPoint [point [lindex $link 1] 2]
		set toPoint   [point [lindex $link 1] 6]
	} elseif {[face [lindex $link 1] 1]==[lindex $link 0]} {
		set fromPoint [point [lindex $link 0] 2]
		set toPoint   [point [lindex $link 0] 6]
	} elseif {[face [lindex $link 0] 3]==[lindex $link 1]} {
		set fromPoint [point [lindex $link 1] 1]
		set toPoint   [point [lindex $link 1] 5]
	} else {
		set fromPoint [point [lindex $link 0] 1]
		set toPoint   [point [lindex $link 0] 5]
	}
	return [mirror $x $y "$fromPoint point" "$toPoint point"]
}

proc regular_threeway {x y link} {
	set blockFace [lindex $link 0]
	while 1 {
		set blockFace [face $blockFace 2]
		if {[lsearch $link $blockFace]<0} { break }
	}

	set fromFace [face $blockFace 7]
	set toFace   [face $blockFace 1]
	return [angledMirror $x $y "$fromFace face" "$toFace face" 4]
}

proc irregular_threeway {x y link} {
	foreach arm $link {
		if {![contains_opposite_face $link $arm]} {
			set irregularFace $arm
			break
		}
	}

	if {[lsearch $link [face $irregularFace 1]]>=0} {
		set fromPoint [point $irregularFace 3]
		set toPoint [point $irregularFace 5]
	} else {
		set fromPoint [point $irregularFace 4]
		set toPoint [point $irregularFace 6]
	}
	return [angledMirror $x $y "$fromPoint point" "$toPoint point" 4]
}

proc adjacent_threeway {x y link} {
	set blockFace [lindex $link 0]
	while 1 {
		set blockFace [face $blockFace 1]
		if {[lsearch $link $blockFace]<0} { break }
	}

	set fromPoint [point $blockFace 8]
	set toPoint [point $blockFace 5]
	return [angledMirror $x $y "$fromPoint point" "$toPoint point" 10]
}

proc regular_fourway {x y link} {
	set size [::grid::get tile_pixels]

	set items {}

	foreach arm $link {
		set from "[point $arm 1] point"
		lappend items [block $x $y $from 2]
	}

	if {[lsearch $link "n"]>=0} {
		set diamondSize [expr {$::Q2*$size/4}]
		lappend items [::geometry::diamond $x $y $diamondSize -fill #$::mirrorColour -width 0]
	} else {
		set squareSize [expr {$size/2}]
		lappend items [::geometry::square $x $y "straight" $squareSize -fill #$::mirrorColour -width 0]
	}


	return $items
}

proc double_right_mirror {x y link} {
	if {[face [lindex $link 0] 2]==[lindex $link 1]} {
		set fromFace [face [lindex $link 1] 1]
		set toFace   [face [lindex $link 1] 5]
	} else {
		set fromFace [face [lindex $link 0] 1]
		set toFace   [face [lindex $link 0] 5]
	}
	return [double_mirror $x $y "$fromFace face" "$toFace face"]
}

proc double_versatile_mirror {x y link} {
	if {[face [lindex $link 0] 1]==[lindex $link 1]} {
		set fromPoint [point [lindex $link 1] 2]
		set toPoint   [point [lindex $link 1] 6]
	} elseif {[face [lindex $link 1] 1]==[lindex $link 0]} {
		set fromPoint [point [lindex $link 0] 2]
		set toPoint   [point [lindex $link 0] 6]
	} elseif {[face [lindex $link 0] 3]==[lindex $link 1]} {
		set fromPoint [point [lindex $link 1] 1]
		set toPoint   [point [lindex $link 1] 5]
	} else {
		set fromPoint [point [lindex $link 0] 1]
		set toPoint   [point [lindex $link 0] 5]
	}
	return [double_mirror $x $y "$fromPoint point" "$toPoint point"]
}

proc mirror {x y from to} {
	set size [::grid::get tile_pixels]

	set items {}
	set width [expr {$size/10}]

	lassign [coordinate $x $y $from] x1 y1
	lassign [coordinate $x $y $to] x2 y2

	# draw mirror face and block
	lappend items [::geometry::line $x1 $y1 $x2 $y2 $width -fill #$::mirrorColour]
	lappend items [block $x $y $from 8]

	return $items
}

proc double_mirror {x y from to} {
	set size [::grid::get tile_pixels]

	set items {}
	set mirrorWidth [expr {max($size/6,1)}]
	set blockWidth [expr {max($mirrorWidth/2,1)}]

	lassign [coordinate $x $y $from] x1 y1
	lassign [coordinate $x $y $to] x2 y2

	# draw mirror face and block
	lappend items [::geometry::line $x1 $y1 $x2 $y2 $mirrorWidth -fill #$::mirrorColour]
	lappend items [::geometry::line $x1 $y1 $x2 $y2 $blockWidth -fill #$::blockColour]

	return $items
}

proc angledMirror {x y from to extent} {
	set size [::grid::get tile_pixels]

	set items {}
	set width [expr {$size/10}]

	lassign [coordinate $x $y $from] x1 y1
	lassign [coordinate $x $y $to] x2 y2

	# draw mirror face and block
	lappend items [::geometry::line $x $y $x1 $y1 $width -fill #$::mirrorColour]
	lappend items [::geometry::line $x $y $x2 $y2 $width -fill #$::mirrorColour]
	lappend items [block $x $y $from $extent]

	return $items
}

proc star_block {x y link} {

	set items {}
	foreach arm $link {
		set extent 0
		while {[lsearch $link [face $arm [expr {($extent+2)/2}]]]<0} {
			incr extent 2
		}
		if {$extent==0} { continue }

		set from "[point $arm 1] point"
		lappend items [block $x $y $from $extent]
	}

	lappend items {*}[star $x $y]

	return $items
}

proc star {x y} {
	set size [::grid::get tile_pixels]
	set squareSize [expr {$size/2}]
	set diamondSize [expr {$::Q2*$size/4}]

	lappend items [::geometry::square $x $y "straight" $squareSize -fill #$::mirrorColour -width 0]
	lappend items [::geometry::diamond $x $y $diamondSize -fill #$::mirrorColour -width 0]
}

proc block {x y from extent} {
	set size [::grid::get tile_pixels]

	lassign $from position type

	set coordinates {}
	lappend coordinates $x $y
	lappend coordinates {*}[coordinate $x $y $from]

	if {$type=="face"} {
		set position [point $position 1]
		lappend coordinates {*}[coordinate $x $y "$position point"]
		incr extent -1
	}

	while {$extent>1} {
		set position [point $position 1]
		lappend coordinates {*}[coordinate $x $y "$position point"]
		incr extent -2
	}

	if {$extent==1} {
		set position [face $position 1]
		lappend coordinates {*}[coordinate $x $y "$position face"]
	}

	return [::geometry::polygon $coordinates -fill #$::blockColour -width 0]
}

proc filter {x y link colour} {
	set size [::grid::get tile_pixels]
	set filterWidth [expr {2*$size/3}]
	set blockWidth $size

	lassign [coordinate $x $y "[lindex $link 0] face"] x1 y1
	lassign [coordinate $x $y "[lindex $link 1] face"] x2 y2

	set x1 [expr {$x + ($x-$x1)/2}]
	set y1 [expr {$y + ($y-$y1)/2}]
	set x2 [expr {$x + ($x-$x2)/2}]
	set y2 [expr {$y + ($y-$y2)/2}]

	lappend items [::geometry::line $x1 $y1 $x2 $y2 $blockWidth -fill #$::blockColour]
	lappend items [::geometry::line $x1 $y1 $x2 $y2 $filterWidth -fill #[::colour::dull_rgb $colour]]
	return $items
}

proc prism {x y main_face prism_orientation} {
	set size [::grid::get tile_pixels]

	# the prism is drawn as a triangle
	# first point of the triangle is 1/6 of the way between the point next to the main face and the third point away in the other direction
	if {$prism_orientation=="left"} {
		set nearPoint [point $main_face 1]
		set farPoint  [point $main_face 6]
	} else {
		set nearPoint [point $main_face 8]
		set farPoint  [point $main_face 3]
	}
	lassign [coordinate $x $y "$nearPoint point"] xn yn
	lassign [coordinate $x $y "$farPoint point"]  xf yf
	set x1 [expr {$xn + ($xf-$xn)/6}]
	set y1 [expr {$yn + ($yf-$yn)/6}]

	# second point is 1/6 of the way between the near point again and the third point away from the main face in the same direction
	if {$prism_orientation=="left"} {
		set farPoint  [point $main_face 3]
	} else {
		set farPoint  [point $main_face 6]
	}
	lassign [coordinate $x $y "$farPoint point"] xf yf
	set x2 [expr {$xn + ($xf-$xn)/6}]
	set y2 [expr {$yn + ($yf-$yn)/6}]

	# third point is halfway between the point after the red face and the second point after that
	if {$prism_orientation=="left"} {
		set redPoint  [point $main_face 4]
		set lastPoint [point $main_face 6]
	} else {
		set redPoint  [point $main_face 5]
		set lastPoint [point $main_face 3]
	}
	lassign [coordinate $x $y "$redPoint point"]  xr yr
	lassign [coordinate $x $y "$lastPoint point"] xl yl
	set x3 [expr {$xr + ($xl-$xr)/2}]
	set y3 [expr {$yr + ($yl-$yr)/2}]

	lappend items [::geometry::polygon $x1 $y1 $x2 $y2 $x3 $y3 -fill #$::mirrorColour -width 0]
	return $items
}

}