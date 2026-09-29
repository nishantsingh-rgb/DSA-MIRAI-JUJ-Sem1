#include <iostream>
using namespace std;

int main() {
    char ch = 'g';

    char upper = ch - 32;   // 'a'-'z' to 'A'-'Z'
    char original = upper + 32;

    cout << "Original     : " << ch << endl;
    cout << "Uppercase    : " << upper << endl;
    cout << "Back to lower: " << original << endl;
    return 0;
}
