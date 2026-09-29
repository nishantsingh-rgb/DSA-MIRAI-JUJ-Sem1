#include <iostream>
using namespace std;

int main() {
    char ch;
    cout << "Enter a character: ";
    cin >> ch;

    if (ch >= '0' && ch <= '9') {
        cout << ch << " is a digit" << endl;
    } else if (ch=='a'||ch=='e'||ch=='i'||ch=='o'||ch=='u'||
               ch=='A'||ch=='E'||ch=='I'||ch=='O'||ch=='U') {
        cout << ch << " is a vowel" << endl;
    } else if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {
        cout << ch << " is a consonant" << endl;
    } else {
        cout << ch << " is not alphanumeric" << endl;
    }
    return 0;
}
