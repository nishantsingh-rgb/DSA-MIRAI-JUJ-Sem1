#include <iostream>
using namespace std;

int main() {
    char ch = 'A';
    int asciiValue = ch;  // implicit char -> int

    cout << "Character  : " << ch << endl;
    cout << "ASCII value: " << asciiValue << endl;
    return 0;
}
