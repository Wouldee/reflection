namespace eval ::store {
variable storeCommand

proc game {level_no} {
	set fileName [storeFile $level_no]

	set fidOpen 0
	set loaded 0
	set shuffled 0
	set replayed 0
	set result 1

	while 1 {
		if {$result!=""} {
			set method_args [lassign [yield $result] method]
			set result ""
		}

		switch -- $method {
			"cancel" {
				if {$fidOpen} {	close $fid }
				delete $level_no
				set fidOpen 0
				set result 0
			}
			"load" {
				# load a saved game
				# cehck the save file for this level exists
				if {![file exists $fileName]} { set method "cancel"; continue }

				# parse arguments, open file
				set grid_id [lindex $method_args 0]
				set fid [open $fileName r]
				set fidOpen 1

				# first line is the level settings when the saved game was created
				# check the same settings apply
				if {[eof $fid]} { set method "cancel"; continue }
				set level_args [gets $fid]
				if {$level_args != [level_args $level_no]} { set method "cancel"; continue }

				# grid settings
				if {[eof $fid]} { set method "cancel"; continue }
				lassign [gets $fid] tiling size continuous_x continuous_y nodes
				::grid::new $tiling $size $continuous_x $continuous_y $grid_id
				# ::grid::set nodes $nodes

				# restore the tiles
				set ok 1
				::tiling::each_tile x y {
					if {[eof $fid]} {set ok 0}
					::tile::restore [gets $fid]
					::generate::update_tile $x $y
					::generate::finalise_tile $x $y
				}
				if {!$ok} { set method "cancel"; continue }

				# restore the paths
				::tiling::each_tile x y {
					if {[::tile::get type]=="source"} {
						set colour [::tile::get colour]
						::tile::each_link {
							set arm [lindex $link 0]

							set path_source [list $x $y $link_id]
							set paths_out {}
							dict set paths_out $path_source [list [list $path_source]]
							::tile::set_paths $link_id out $arm $paths_out

							set neighbour [::tile::neighbour $arm]
							if {$neighbour=={}} { continue }

							::paths::add {*}$neighbour $paths_out
						}
					}
				}

				# return true
				set loaded 1
				set result $loaded
			}
			"reshuffle" {
				if {!$loaded || !$fidOpen || [eof $fid]} { set method "cancel"; continue }

				set rotations 0
				foreach {x y rotation} [gets $fid] {
					incr rotations [::game::rotate_tile $x $y $rotation]
				}

				# draw
				::tiling::each_tile x y { ::tiling::draw_tile $x $y }

				# return the number of rotations
				set shuffled 1
				set result $rotations
			}
			"replay actions" {
				if {!$shuffled || !$fidOpen} { set method "cancel"; continue }

				set moves 0
				set time 0

				set scrollx 0
				set scrolly 0

				while {![eof $fid]} {
					set line [gets $fid]
					if {$line==""} { continue }

					set action_args [lassign $line action time]
					switch -- $action {
						"rotate" {
							::game::rotate_tile {*}$action_args
							incr moves
						}
						"scrollx" {
							set amount [lindex $action_args 0]
							incr scrollx $amount
						}
						"scrolly" {
							set amount [lindex $action_args 0]
							incr scrolly $amount
						}
					}
				}

				::tiling::scrollx $scrollx
				::tiling::scrolly $scrolly

				close $fid
				set fidOpen 0

				# return moves and time
				set result [list $moves $time]
			}
			"new" {
				# open file for writing, erasing any existing data
				set fid [open [storeFile $level_no] w]

				puts $fid [level_args $level_no]

				puts $fid [list [::grid::get tiling] [::grid::get size] [::grid::get continuous_x] [::grid::get continuous_y] [::grid::get nodes]]
				::tiling::each_tile x y {
					puts $fid [::tile::store]
				}
				close $fid
				set result 1
			}
			"shuffle" {
				set rotations [lindex $method_args 0]
				set fid [open [storeFile $level_no] a]
				puts $fid $rotations
				close $fid
				set result 1
			}
			"action" {
				set arguments [lassign $method_args action time]
				set fid [open [storeFile $level_no] a]
				puts $fid [list $action $time {*}$arguments]
				close $fid
				set result 1
			}
			"finish" {
				if {$fidOpen} {	close $fid }
				return 1
			}
			default {
				error "invalid store action '$action'"
			}
		}
	}
}

proc storeFile {level_no} {
	if {$level_no=="?"} {
		set filename "random"
	} else {
		set filename $level_no
	}
	return [file join $::storeDir "$filename.store"]
}

# delete the saved data for a level
proc delete {level_no} {
	set fileName [storeFile $level_no]
	if {![file exists $fileName]} { return }
	close [open $fileName w]
}

proc level_args {level_no} {
	foreach level $::levels {
		if {[lindex $level 0]==$level_no} { break }
	}
	return [lrange $level 1 end]
}

}
