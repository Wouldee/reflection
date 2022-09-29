

set log_level 0
set tile_info 0
set shuffle 1
set outlines 0
set border "white"
set mirrorColour "d0d0d0"
set blockColour "303030"
set teleporterColour "603060"

set logFile "reflection.log"
set dictTree 1
set statsFile "reflection.stats"
set storeDir "./store"

# height should ideally be sqrt(3)*(width-200)/2
# and width should be 2*height/sqrt(3) + 200
set screenwidth [winfo vrootwidth .]
set width [expr {max($screenwidth/2,1100)}]
set height [expr {round(sqrt(3)*2*($width)/5)}]

# square roots
set Q2 [expr {sqrt(2)}]
set Q3 [expr {sqrt(3)}]
set Q5 [expr {sqrt(5)}]

set selectedLevel 0

# tiling size colour sources mix cartesian filter
set levels {}
lappend levels {1 triangular 2 -sources 1 -rgb g}
lappend levels {2 squares 3 -sources 2 -rgb rb -continuous_x 0 -continuous_y 0}
lappend levels {3 elongatedTriangular 1 -sources 2 -rgb gb -continuous_x 0}
lappend levels {4 snubSquare 2 -sources 6}
lappend levels {5 hexagonal 2 -sources 2}
lappend levels {6 trihexagonal 2 -continuous_y 0}
lappend levels {7 rhombitrihexagonal 1}
lappend levels {8 truncatedSquare 2}
lappend levels {9 triangular 8}
lappend levels {10 squares 9}
lappend levels {11 elongatedTriangular 2}
lappend levels {12 snubSquare 3}
lappend levels {13 hexagonal 5 -sources 1}
lappend levels {14 trihexagonal 3}
lappend levels {15 rhombitrihexagonal 2}
lappend levels {16 truncatedSquare 5}
lappend levels {17 triangular 18}
lappend levels {18 squares 19}
lappend levels {19 elongatedTriangular 5}
lappend levels {20 snubSquare 6}
lappend levels {21 hexagonal 10}
lappend levels {22 trihexagonal 6}
lappend levels {23 rhombitrihexagonal 4}
lappend levels {24 truncatedSquare 10}
#lappend levels {25 triangular 30}
#lappend levels {26 squares 31}
#lappend levels {27 elongatedTriangular 8}
#lappend levels {28 snubSquare 10}
#lappend levels {29 hexagonal 31}
#lappend levels {30 trihexagonal 19}
#lappend levels {31 rhombitrihexagonal 14}
#lappend levels {32 truncatedSquare 16}
# lappend levels {? random}