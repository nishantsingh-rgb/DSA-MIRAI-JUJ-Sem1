#include <iostream>
using namespace std;

int main() {
    cout << boolalpha;

    cout << "AND (&&) Truth Table" << endl;
    cout << "true  && true  = " << (true && true) << endl;
    cout << "true  && false = " << (true && false) << endl;
    cout << "false && true  = " << (false && true) << endl;
    cout << "false && false = " << (false && false) << endl;

    cout << endl << "OR (||) Truth Table" << endl;
    cout << "true  || true  = " << (true || true) << endl;
    cout << "true  || false = " << (true || false) << endl;
    cout << "false || true  = " << (false || true) << endl;
    cout << "false || false = " << (false || false) << endl;

    return 0;
}
