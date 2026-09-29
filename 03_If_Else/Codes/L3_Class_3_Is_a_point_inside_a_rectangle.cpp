#include <iostream>
using namespace std;

int main() {
    // Rectangle spans x: [0, width], y: [0, height]
    double width = 10, height = 5;
    double x, y;

    cout << "Enter point (x y): ";
    cin >> x >> y;

    if (x >= 0 && x <= width && y >= 0 && y <= height) {
        cout << "Point is inside the rectangle" << endl;
    } else {
        cout << "Point is outside the rectangle" << endl;
    }
    return 0;
}
