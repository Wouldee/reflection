
# other ideas:
#	"teleporter"	; # connection is always made with matching teleporter(s)
#	"prism"			; # sort of a hybrid of a source and a connecter. Receives light from one
#					connection only. If receiving end is west, emits red to the north (if
#					received colour contans red), green to the east, and blue to the south. Any
#					colours recieved through the emiters do not go anywhere

# first place the sources randomly in the grid
# add sources to a list of tiles to process
# while there are still tiles to be processed
# choose a tile at random from the list of tiles to process to add an arm to
# check each direction out of the tile
# if the neighbour in that direction is empty OK
# otherwise check if a multi-link connector is possible...
# choose one of the available directions randomly to add a link to
# if the tile has no way to add an arm then remove it from the list of tiles to process
# if we add an arm then add the next tile to the list of tiles to process
namespace eval ::game {

# coroutine....
proc play {tiling size args} {
	set nodes 0
	set lit 0

	set game_args [::process_args options $args {continuous_x 1 continuous_y 1 level "?"}]
	set gameCommand [info coroutine]
	set gameOverCommand ""

	if {[info commands store]!={}} {store finish}
	coroutine store ::store::game $options(level)

	# source "tiling/${tiling}.tcl"
	#namespace eval ::shape {source triangle.tcl}

	# control panel on the left-hand side
	# game on the right
	# determine how much room we have to play with
	# first find out how much width will be used if the grid uses the entire height
	# allow 5 pixels on either side, and 20 more for the scroll buttons...
	# should be proportional to the size...
	set xPad 5
	set yPad 5
	set scrollxButtonSize [expr {$options(continuous_x)} ? {20} : {0}]
	set scrollyButtonSize [expr {$options(continuous_y)} ? {20} : {0}]
	set minPanelWidth 100
	set gridHeight [expr {$::height-2*($yPad+$scrollyButtonSize)}]
	set gridWidth [::${tiling}::xPixels $gridHeight $size]
	if {($gridWidth + $minPanelWidth + 2*($xPad+$scrollxButtonSize)) > $::width} {
		set gridWidth [expr {$::width - ($minPanelWidth + 2*($xPad+$scrollxButtonSize))}]
		set gridHeight [::${tiling}::yPixels $gridWidth $size]
		set yPad [expr {($::height - ($gridHeight+2*$scrollyButtonSize))/2}]
	}
	set panelWidth [expr {$::width - ($gridWidth + 2*($xPad+$scrollxButtonSize))}]

	set panel_id [[screen] create rectangle 0 0 $panelWidth $::height -fill black -width 0 -tags {"panel"}]

	# display the level number
	set x [expr {$panelWidth/2}]
	::widget::text $x 40 center "LEVEL $options(level)" 30 -tags {"panel"}

	::geometry::line 5 62 [expr {$panelWidth-5}] 62 3 -fill white -tags {"panel"}

	set progress_text_id [::widget::text $x 90 center "$lit/$nodes" 40 -tags {"panel"}]
	set progress_bar_id [widget::progress_bar $x 120 190 15 -tags {"panel"}]

	::geometry::line 5 135 [expr {$panelWidth-5}] 135 3 -fill white -tags {"panel"}

	set timer_id [::widget::timer $x 155 center 30 -tags {"panel"}]
	set move_counter_text_id [::widget::text $x 185 center "0 MOVES" 20 -tags {"panel"}]

	::geometry::line 5 200 [expr {$panelWidth-5}] 200 3 -fill white -tags {"panel"}

	::widget::text $x 220 center "RECORDS" 20 -tags {"panel"}
	set best_time_text_id [::widget::text $x 250 center "" 14 -tags {"panel"}]
	set best_moves_text_id [::widget::text $x 270 center "" 14 -tags {"panel"}]
	set best_score_text_id [::widget::text $x 290 center "" 14 -tags {"panel"}]
	set best_rating_text_id [::widget::text $x 310 center "" 14 -tags {"panel"}]

	::widget::text $x 350 center "RESTART" 20 -tags {"restart" "panel"}
	::widget::text $x 400 center "NEW GAME" 20 -tags {"panel"} -click "::game::action $gameCommand {NewGame}"
	::widget::text $x 450 center "MENU" 20 -tags {"menu" "panel"} -click "::game::action $gameCommand {Quit}; break"

	set scroll_text_id [::widget::text $x 500 center "" 16 -tags {"panel"}]

	# create the game grid
	set borderColour $::border
	if {$borderColour!=""} {
		set borderWidth 1
	} else {
		set borderWidth 0
	}
	set x1 [expr {$xPad + $panelWidth + $scrollxButtonSize}]
	set y1 [expr {$yPad + $scrollyButtonSize}]
	set x2 [expr {$x1 + $gridWidth}]
	set y2 [expr {$y1 + $gridHeight}]
	set grid_id [[::screen] create rectangle $x1 $y1 $x2 $y2 -fill black -width $borderWidth -outline $borderColour]

	# create the bindings
	set bindings {
		.c 	0 <Button-1>         "leftClick %x %y"
		.c 	0 <Button-3>         "rightClick %x %y"
		.c 	0 <Control-Button-1> "ctrlClick %x %y"
		. 	0 <Key-Left>         "scrollx left 1"
		. 	0 <Key-a>            "scrollx left 1"
		. 	0 <Key-A>            "scrollx left 1"
		. 	0 <Key-Right>        "scrollx right 1"
		. 	0 <Key-d>            "scrollx right 1"
		. 	0 <Key-D>            "scrollx right 1"
		. 	0 <Key-Up>           "scrolly up 1"
		. 	0 <Key-w>            "scrolly up 1"
		. 	0 <Key-W>            "scrolly up 1"
		. 	0 <Key-Down>         "scrolly down 1"
		. 	0 <Key-s>            "scrolly down 1"
		. 	0 <Key-S>            "scrolly down 1"
		.	1 <Key-F11>          ""
		.	1 <Key-p>            "pause"
		.	1 <Key-P>            "pause"
		.	0 <Key-f>            "findUnlitNode"
		.	0 <Key-F>            "findUnlitNode"
	}

	foreach {widgetPath pausedOK event action} $bindings {
		set script ""
		append script {
			set command "} $gameCommand {"
			set action "} $action {"

			if {[info commands $command] eq ""} break
		}

		if {!$pausedOK} {
			# only execute the command if the game is not paused
			append script {
				if {[::game::action $command "paused"] != 0} break
			}
		}

		append script {
			::game::action $command $action
		}

		bind $widgetPath $event $script
	}

	update

	set started 0
	set zoomed 0
	set result 0

	# game event loop
	while 1 {
		set action_args [lassign [yield $result] action]

		if {!$started} {set action "NewGame"}
		catch { [::screen] delete over }

		switch -- $action {
		"Quit" { break }
		"NewGame" {
			if {$started} {
				[::screen] delete game
				::store::delete $options(level)
			}
			# catch { [::screen] delete over }
			if {[info commands game_over] ne ""} { game_over "Close" }
			::timer::reset $timer_id

			# saved game?
			if {[store [list load $grid_id]]} {
				set par [store {"reshuffle"}]
				lassign [store {"replay actions"}] moves time

				::timer::duration $timer_id $time
			} else {
				# make a new game
				# initialise the grid
				::grid::new $tiling $size $options(continuous_x) $options(continuous_y) $grid_id
				[::screen] lower $grid_id

				# populate the grid with a network of tiles
				set tiles [::generate::game {*}$game_args]

				# save the new game
				store {new}

				# rotate each tile, making it a puzzle
				set par [shuffle_grid $options(level) $tiles]

				set moves 0
			}

			::timer::start $timer_id

			set nodes [::grid::get nodes]
			set lit [::grid::get lit]

			update_best_time $options(level) $best_time_text_id
			update_best_moves $options(level) $best_moves_text_id
			update_best_score $options(level) $best_score_text_id
			update_best_rating $options(level) $best_rating_text_id

			set started 1
			set finished 0
			set paused 0
		}
		"leftClick" {
			lassign $action_args mousex mousey
			lassign [::tiling::tile_at $mousex $mousey] x y
			if {$x!="" && $y!=""} {
				incr moves [::game::rotate_tile $x $y 1]
				store [list action "rotate" [::timer::duration $timer_id] $x $y 1]
			}
		}
		"rightClick" {
			lassign $action_args mousex mousey
			lassign [::tiling::tile_at $mousex $mousey] x y
			if {$x!="" && $y!=""} {
				::game::rotate_tile $x $y -1
				incr moves
				store [list action "rotate" [::timer::duration $timer_id] $x $y -1]
			}
		}
		"ctrlClick" {
			lassign $action_args mousex mousey
			lassign [::tiling::tile_at $mousex $mousey] x y
			if {$x!="" && $y!=""} {
				::game::tile_info $x $y
			}
		}
		"paused" { set result $paused }
		"pause" {
			if {$finished} {continue}
			if {$paused} {
				[screen] delete paused
				[screen] lower $grid_id game
				::timer::start $timer_id
				set paused 0
			} else {
				[screen] raise $grid_id game
				[screen] raise panel
				lassign [[screen] coords $grid_id] x1 y1 x2 y2
				::widget::text [expr {$x1 + ($x2-$x1)/2}] [expr {$y1 + ($y2-$y1)/2}] center "PAUSED" 50 -tags {"paused" "game"}
				::timer::stop $timer_id
				set paused 1
			}
		}
		"findUnlitNode" {
			if {$finished} {continue}

			::tiling::each_tile x y {
				if {[::tile::get type]=="node" && ![::tile::get lit]} { break }
			}

			if {$zoomed} {
				scroll_to_tile $x $y
			} else {
				wink_node $x $y
			}
		}
		"scrollx" {
			lassign $action_args direction amount
			if {![::grid::get continuous_x]} continue

			if {$direction=="left"} {
				set amount [expr {0-$amount}]
			}

			::tiling::scrollx $amount
			store [list action "scrollx" [::timer::duration $timer_id] $amount]
		}
		"scrolly" {
			lassign $action_args direction amount
			if {![::grid::get continuous_y]} continue

			if {$direction=="up"} {
				set amount [expr {0-$amount}]
			}

			::tiling::scrolly $amount
			store [list action "scrollx" [::timer::duration $timer_id] $amount]
		}
		} ; # end switch

		set lit [::grid::get lit]
		::text::update $progress_text_id "$lit/$nodes"
		::progress_bar::update $progress_bar_id [expr {100.0*$lit/$nodes}]
		::text::update $move_counter_text_id "$moves/$par MOVES"
		::text::update $scroll_text_id "[::grid::get scrollx], [::grid::get scrolly]"
		[screen] raise panel


		if {!$finished && $lit==$nodes} {
			set time [::timer::stop $timer_id]
			if {$::shuffle} {
				coroutine game_over ::game::over $options(level) $tiling $size $par $moves $time $grid_id
				update_best_time $options(level) $best_time_text_id
				update_best_moves $options(level) $best_moves_text_id
				update_best_score $options(level) $best_score_text_id
				update_best_rating $options(level) $best_rating_text_id
			}

			# delete the saved game
			::store::delete $options(level)

			set finished 1
		} 
	}

	if {[info commands game_over] ne ""} { game_over "Close" }

	::timer::stop $timer_id
	catch { [::screen] delete over }
	[::screen] delete game
	[::screen] delete panel
	[::screen] delete $grid_id
	::home
}

proc over {level tiling size par moves time grid_id} {
	set gameOverCommand [info coroutine]

	set par_time [par_time $tiling $size $par]

	lassign [score $tiling $size $par $moves $time] score rating
	::stats::update_level $level time $time par_time $par_time moves $moves par $par score $score rating $rating

	#[screen] create rectangle 0 0 $::width $::height -fill "" -outline "" -tags {"over" "game"}
	lassign [[screen] coords $grid_id] gx1 gy1 gx2 gy2
	set grid_width [expr {round($gx2-$gx1)}]
	set grid_height [expr {round($gy2-$gy1)}]

	set width [expr {$grid_width/2}]
	set height [expr {$grid_height/2}]
	set x1 [expr {round($gx1 + $grid_width/2 - $width/2)}]
	set y1 [expr {round($gy1 + $grid_height/2 - $height/2)}]
	set x2 [expr {round($gx1 + $grid_width/2 + $width/2)}]
	set y2 [expr {round($gy1 + $grid_height/2 + $height/2)}]
	[screen] create rectangle  $x1 $y1 $x2 $y2 -fill black -outline "" -tags {"over"}

	set x [expr {$x1 + $width/2}]
	set y [expr {$y1 + $height/10}]
	::widget::text $x $y center "DONE" [expr {$height/8}] -tags {"over"}

	set y [expr {$y1 + 2*$height/10}]
	::geometry::line [expr {$x1+$width/20}] $y [expr {$x2-$width/20}] $y 3 -fill white -tags {"over"}

	set y [expr {$y1 + 3*$height/10}]
	::widget::text $x $y center "...IN [::display_time $time] WITH $moves MOVES" [expr {$height/20}] -tags {"over"}
	set y [expr {$y1 + 4*$height/10}]
	::widget::text $x $y center "PAR WAS [::display_time $par_time] AND $par MOVES" [expr {$height/20}] -tags {"over"}

	set y [expr {$y1 + 5*$height/10}]
	::widget::text $x $y center "SCORE: [comma_number $score]" [expr {$height/16}] -tags {"over"}
	set y [expr {$y1 + 6*$height/10}]
	::widget::text $x $y center "RATING: [format %.2f $rating]%" [expr {$height/16}] -tags {"over"}
	set y [expr {$y1 + 7.2*$height/10}]
	::widget::text $x $y center "[grade $rating]" [expr {$height/10}] -tags {"over"}	

	set y [expr {$y1 + 8*$height/10}]
	::geometry::line [expr {$x1+$width/20}] $y [expr {$x2-$width/20}] $y 3 -fill white -tags {"over"}

	set y [expr {$y1 + 9*$height/10}]
	::widget::text $x $y center "CLOSE" [expr {$height/10}] -tags {"over"} -click "::game::action $gameOverCommand {Close}"

	update

	while 1 {
		set action_args [lassign [yield 0] action]
		switch -- $action {
			"Close" { break }
		}
	}

	[::screen] delete over
}

proc score {tiling size par moves time} {
	set complexity [::${tiling}::complexity]
	set tiles [::${tiling}::tiles $size]

	set base_score [expr {$tiles*$complexity**2}]
	set total_score [expr {$base_score*4}]

	set par_time [par_time $tiling $size $par]
	set remaining_time [expr { double($time) }]
	set factor [expr {double($base_score)/$par_time}]
	set divisor 1
	while {$remaining_time>0} {
		if {$remaining_time<$par_time} {
			set deduction [expr {$factor*$remaining_time/$divisor}]
		} else {
			set deduction [expr {$factor*$par_time/$divisor}]
		}
		if {$deduction<0.5} { break }
		set total_score [expr {$total_score - $deduction}]
		set remaining_time [expr {$remaining_time - $par_time}]
		incr divisor $divisor
	}

	set remaining_moves [expr { double($moves)}]
	set factor [expr {double($base_score)/$par}]
	set divisor 1
	while {$remaining_moves>0} {
		if {$remaining_moves<$par} {
			set deduction [expr {$factor*$remaining_moves/$divisor}]
		} else {
			set deduction [expr {$factor*$par/$divisor}]
		}
		if {$deduction<0.5} { break }
		set total_score [expr {$total_score - $deduction}]
		set remaining_moves [expr {$remaining_moves - $par}]
		incr divisor $divisor
	}

	set score [expr {7*round(100*$total_score)}]
	set percent [expr {50*$total_score/$base_score}]

	return [list $score $percent]
}

proc grade {rating} {
	if {$rating>=100} {
		return "A+"
	} elseif {$rating>=95} {
		return "A"
	} elseif {$rating>=90} {
		return "A-"
	} elseif {$rating>=85} {
		return "B+"
	} elseif {$rating>=80} {
		return "B"
	} elseif {$rating>=70} {
		return "B-"
	} elseif {$rating>=60} {
		return "C+"
	} elseif {$rating>=50} {
		return "C"
	} elseif {$rating>=40} {
		return "C-"
	} elseif {$rating>=30} {
		return "D+"
	} elseif {$rating>=20} {
		return "D"
	} elseif {$rating>=10} {
		return "D-"
	} elseif {$rating>=5} {
		return "E+"
	} elseif {$rating>=1} {
		return "E"
	} elseif {$rating>=0} {
		return "E-"
	} else {
		return "F"
	}
}

proc par_time {tiling size par_moves} {
	set complexity [::${tiling}::complexity]
	set tiles [::${tiling}::tiles $size]

	set par_time [expr {$tiles*$complexity**2 / 20}]
	set par_time [expr {round($par_time + $par_moves/3.0)}]
	return $par_time
}

proc update_best_time {level widget_id} {
	set best_time [::stats::best $level time]
	set best_par_time [::stats::best $level par_time]
	if {$best_time!=""} {
		set best_time [::display_time $best_time]/[::display_time $best_par_time]
	} else {
		set best_time "--:--:--"
	}

	::text::update $widget_id "TIME: $best_time"
}

proc update_best_moves {level widget_id} {
	set moves [::stats::best $level moves]
	set par [::stats::best $level par]
	if {$moves==""} {
		set best_moves "--"
	} else {
		set best_moves "$moves/$par"
	}

	::text::update $widget_id "MOVES: $best_moves"
}

proc update_best_score {level widget_id} {
	set score [::stats::best $level score]
	if {$score==""} {
		set best_score "0"
	} else {
		set best_score [comma_number $score]
	}

	::text::update $widget_id "SCORE: $best_score"
}

proc update_best_rating {level widget_id} {
	set rating [::stats::best $level rating]
	if {$rating==""} {
		set best_rating "0.00"
	} else {
		set best_rating [format %.02f $rating]
	}

	::text::update $widget_id "RATING: ${best_rating}%"
}

proc action {game action} {
	if {[info commands $game]==""} {
		# go back to the menu...
		return
	}
	$game $action
}

# shuffle the grid
# return the total number of rotations
proc shuffle_grid {level_no tiles} {
	set start [clock microseconds]

	lassign $tiles sources connectors nodes

	set rotations 0
	set shuffle_store {}

	# rotate the sources, then the connectors, then draw everything
	if {$::shuffle} {
		foreach source $sources {
			lassign $source x y
			set by [::tiling::random_rotation $x $y]
			incr rotations [rotate_tile $x $y $by]
			lappend shuffle_store $x $y $by
		}

		foreach connector $connectors {
			lassign $connector x y
			set by [::tiling::random_rotation $x $y]
			incr rotations [rotate_tile $x $y $by]
			lappend shuffle_store $x $y $by
		}

		store [list shuffle $shuffle_store]
	}

	# draw
	::tiling::each_tile x y {
		::tiling::draw_tile $x $y
	}

	set duration [expr {[clock microseconds]-$start}]
	::logToFile "$duration ms to shuffle" 1

	return $rotations
}

proc tile_info {x y} {
	if {$::dictTree} {
		catch {destroy .p}
		set tile [::tile::tile $x $y]
		toplevel .p
		wm transient .p
		wm title .p "tile $x,$y"
		set d [dictree .p.d $tile]
		pack $d -expand yes -fill both
	} else {
		logToFile "tile @ $x,$y:\n[::tile::dump]"
	}
}

proc wink_node {x y} {
	# set the lit flag to true
	::tile::set lit 1
	# redraw the tile
	::tiling::draw_tile $x $y
	# change it back
	::tile::set lit 0

	# wait a bit before redrawing
	after 200 "::tiling::draw_tile $x $y"
}

# rotate a tile
# check if tile has been connected/disconnected from a colour circuit...
# return the actual rotation
proc rotate_tile {x y {by 1}} {
	if {[::tile::get type]=="node"} {return 0}
	if {[::tile::get type]=="teleporter"} {return 0}

	logToFile "rotating tile @ $x,$y by $by\n[::tile::dump]" 2

	# build a list of changed links and link_ids for the changed links
	set link_ids [::tile::get all_link_ids]
	set new_links {}

	# every link
	::tile::each_link {
		# bug: empty links
		if {$link=={}} {
			logToFile "Tile @ $x,$y has empty link $link_id:\n[::tile::dump]" 1
			#::tile::delete_link $link_id
			continue
		}

		set new_link {}
		# every direction the link connects on
		foreach arm $link {
			# determine the new direction
			lappend new_link [::tiling::rotate_arm $x $y $arm $by]
		}
		set new_link [lsort $new_link]

		# see if the new link already exists
		# get the link_ids of one of the arms
		set arm_link_ids [::tile::link_ids [lindex $new_link 0]]
		# if that arm was part of exactly one link (i.e. it was part of a link, and not on a prism or similar)
		if {[llength $arm_link_ids]==1} {
			set new_link_id [lindex $arm_link_ids 0]
			if {[lsort [::tile::link $new_link_id]]==$new_link} {
				set index [lsearch -integer -sorted $link_ids $new_link_id]
				set link_ids [lreplace $link_ids $index $index]
				continue
			}
		} 

		# otherwise add the link to the list of new links
		lappend new_links $new_link
	}

	set changed_links {}
	foreach link_id $link_ids link $new_links {
		lappend changed_links $link_id $link
	}
	if {$changed_links=={}} {return 0}
	logToFile "changed_links = $changed_links" 3

	array set new_arms {}
	foreach {link_id new_link} $changed_links {
		set link [::tile::link $link_id]

		if {[::tile::get type]=="prism"} {
			# regenerate all the paths on a prism
			set old_arms $link
			set new_arms($link_id) $new_link
		} else {
			set old_arms [old_arms $new_link $link]
			set new_arms($link_id) [new_arms $link $new_link]
		}
		logToFile "old arms for link $link_id @ $x,$y: $old_arms\nnew arms: $new_arms($link_id)" 3

		# check if existing paths need to be removed before updating the grid with the new links
		foreach arm $old_arms {
			# remove any paths coming into this arm
			# this will recursively remove these paths through this link and any neighbours
			paths::remove $x $y $arm
			logToFile "removed all paths on $x,$y in from arm $arm on link $link_id\n[::tile::dump]" 2

			# remove any paths going out this arm
			if {[::tile::paths_exist $link_id out $arm]} {
				::tile::delete_paths $link_id out $arm
				logToFile "deleted paths on $x,$y out arm $arm on link $link_id\n[::tile::dump]" 2

				# remove any paths going into the neighbour from here
				if { [set neighbour [::tile::neighbour $arm]]!={} } {
					lassign $neighbour X Y D
					paths::remove $X $Y $D
				}
				logToFile "removed all paths on $x,$y out of arm $arm on link $link_id\n[::tile::dump]" 2
			}

			# finally remove the arm from the link
			set arm_index [lsearch $link $arm]
			::tile::set_link $link_id [lreplace $link $arm_index $arm_index]
			logToFile "removed $x,$y arm $arm from link $link_id\n[::tile::dump]" 2
		}
	}
	logToFile "removed paths from $x,$y\n[::tile::dump]" 2

	# update the grid with the new links
	foreach {link_id new_link} $changed_links { ::tile::set_link $link_id $new_link }
	logToFile "updated links on $x,$y\n[::tile::dump]" 2

	# add the new paths
	foreach {link_id link} $changed_links {
		# check the neighbouring tiles/links for any new paths in this direction
		foreach arm $new_arms($link_id) {
			# check if there is a neighbouring tile in this direction
			if { [set neighbour [::tile::neighbour $arm]]=={} } continue
			lassign $neighbour X Y D

			set paths_in [paths::from $X $Y $D]
			if {$paths_in=={}} continue
			# add the paths into this tile
			::tile::set_paths $link_id in $arm $paths_in
		}

		# now see if there's any new paths going out
		foreach arm $link {

			set paths_out [paths::calculate $x $y $link_id $arm]
			if { $paths_out=={} } continue

			if {[::tile::paths_exist $link_id out $arm]} {
				set existing_paths [::tile::paths $link_id out $arm]
				if {$existing_paths==$paths_out} continue
			} 

			::tile::set_paths $link_id out $arm $paths_out

			# check if there is a neighbouring tile in this direction
			if { [set neighbour [::tile::neighbour $arm]]=={} } continue
			lassign $neighbour X Y D

			# add the paths going into the neighbour
			::paths::add $X $Y $D $paths_out
		}
	}
	logToFile "added paths to $x,$y\n[::tile::dump]" 2

	::tiling::draw_tile $x $y
	logToFile "finished rotating tile $x,$y\n[::tile::dump]" 2

	# return the effective rotation, minimum of clockwise/anti-clockwise
	# should use symmetry....
	set faces [llength [::tiling::directions $x $y]]
	return [expr {min($by,($faces-$by))}]
}

proc old_arms {link old_link} {
	set old_arms {}
	foreach arm $old_link {
		if {[lsearch $link $arm]<0} {lappend old_arms $arm}
	}
	return $old_arms
}

proc new_arms {link new_link} {
	set new_arms {}
	foreach arm $new_link {
		if {[lsearch $link $arm]<0} {lappend new_arms $arm}
	}
	return $new_arms
}

}