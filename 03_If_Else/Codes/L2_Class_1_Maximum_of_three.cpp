#include <iostream>
using namespace std;

int main() {
    int a = 23, b = 67, c = 45;
    int maximum;

    if (a > b) {
        if (a > c) maximum = a;
        else maximum = c;
    } else {
        if (b > c) maximum = b;
        else maximum = c;
    }

    cout << "Maximum is " << maximum << endl;
    return 0;
}
