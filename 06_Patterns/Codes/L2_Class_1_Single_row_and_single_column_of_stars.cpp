#include <iostream>
using namespace std;

int main() {
    int n = 5;

    cout << "Row:" << endl;
    for (int i = 1; i <= n; i++) {
        cout << "* ";
    }
    cout << endl;

    cout << "Column:" << endl;
    for (int i = 1; i <= n; i++) {
        cout << "*" << endl;
    }
    return 0;
}
